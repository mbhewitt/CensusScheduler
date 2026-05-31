import type { Pool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

import { enqueueEmail } from "lib/mail";

// #309 — when a volunteer is assigned to a shift (admin or self),
// email them with the details + an .ics so the event lands in their
// calendar. UID is deterministic so re-assigns update rather than
// duplicate. Best-effort: a failure here doesn't fail the POST.
//
// Body shape approved by Mew 2026-05-31 — see the per-shift sample
// rendered in the chat: shift_name + position headline, day/time,
// Census Shift Points, critical callout when applicable, then the
// rich-text sections (shift_details, position_details, shift notes,
// meal) — each section is dropped if its column is empty.
//
// Actor attribution: if the action was performed by someone other
// than the volunteer themselves, the opener calls that out so the
// volunteer knows who scheduled / unscheduled them.

const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://volunteers.census.burningman.org";
const CALENDAR_TZID = "America/Los_Angeles";

interface ShiftContext extends RowDataPacket {
  position: string;
  position_details: string | null;
  critical: number;
  shift_name: string;
  shift_details: string | null;
  shift_notes: string | null;
  meal: string | null;
  sap_points: number | null;
  datename: string | null;
  date: string;
  start_time: string | null;
  start_time_text: string | null;
  end_time: string | null;
  end_time_text: string | null;
  email: string | null;
  playa_name: string | null;
  world_name: string | null;
}

const SHIFT_CONTEXT_QUERY = `
  SELECT
    pt.position,
    pt.position_details,
    pt.critical,
    sn.shift_name,
    sn.shift_details,
    st.notes AS shift_notes,
    st.meal,
    stp.sap_points,
    d.datename,
    d.date,
    st.start_time,
    st.start_time_text,
    st.end_time,
    st.end_time_text,
    v.email,
    v.playa_name,
    v.world_name
  FROM op_volunteer_shifts vs
  JOIN op_shift_time_position stp
    ON stp.time_position_id = vs.time_position_id
  JOIN op_position_type pt
    ON pt.position_type_id = stp.position_type_id
  JOIN op_shift_times st
    ON st.shift_times_id = stp.shift_times_id
  JOIN op_shift_name sn
    ON sn.shift_name_id = st.shift_name_id
  LEFT JOIN op_dates d
    ON d.date_id = st.start_date_id
  LEFT JOIN op_volunteers v
    ON v.shiftboard_id = vs.shiftboard_id
  WHERE vs.shiftboard_id = ?
    AND vs.time_position_id = ?
  LIMIT 1
`;

// HHMMSS string extracted from `op_shift_times.start_time` / `end_time`.
// Those columns are varchar(32) and in practice hold either a bare
// `HH:MM` (`start_time_text`-shaped) or a full datetime like
// `2026-08-28 11:00`. The unanchored regex grabs the first HH:MM[:SS]
// it finds, which is the time component in either form. Returns null
// only when there's no time substring at all.
//
// We intentionally don't import a TZ lib — the values stored in the
// DB are already wall-clock America/Los_Angeles per the dump
// convention, and we emit them with TZID=America/Los_Angeles.
function timeToIcs(t: string | null): string | null {
  if (!t) return null;
  const m = t.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3] ?? "00"}`;
}

function dateToIcs(d: string | null): string | null {
  if (!d) return null;
  return d.replace(/-/g, "");
}

function nowUtcStamp(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return (
    `${n.getUTCFullYear()}${p(n.getUTCMonth() + 1)}${p(n.getUTCDate())}` +
    `T${p(n.getUTCHours())}${p(n.getUTCMinutes())}${p(n.getUTCSeconds())}Z`
  );
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    parts.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join("\r\n");
}

function buildIcs(args: {
  uid: string;
  summary: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  method: "PUBLISH" | "CANCEL";
  sequence?: number;
}): string {
  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const status = args.method === "CANCEL" ? "CANCELLED" : "CONFIRMED";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Census Scheduler//Census Shift//EN",
    `METHOD:${args.method}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${args.uid}`,
    `SEQUENCE:${args.sequence ?? (args.method === "CANCEL" ? 1 : 0)}`,
    `DTSTAMP:${nowUtcStamp()}`,
    `DTSTART;TZID=${CALENDAR_TZID}:${args.date}T${args.startTime}`,
    `DTEND;TZID=${CALENDAR_TZID}:${args.date}T${args.endTime}`,
    `SUMMARY:${escape(args.summary)}`,
    `DESCRIPTION:${escape(args.description)}`,
    "LOCATION:Black Rock City",
    `STATUS:${status}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n");
}

function shiftIcsUid(
  shiftboardId: number,
  timePositionId: number | string
): string {
  return `census-shift-${timePositionId}-${shiftboardId}@volunteers.census.burningman.org`;
}

async function lookupActorDisplayName(
  pool: Pool,
  actorShiftboardId: number | null
): Promise<string | null> {
  if (!actorShiftboardId) return null;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT playa_name, world_name FROM op_volunteers WHERE shiftboard_id = ? LIMIT 1`,
    [actorShiftboardId]
  );
  const r = rows[0];
  if (!r) return null;
  const name: string | null =
    (typeof r.playa_name === "string" && r.playa_name.trim()) ||
    (typeof r.world_name === "string" && r.world_name.trim()) ||
    null;
  return name;
}

function notBlank(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

// Renders the shared "what's the shift" body section used by both
// assignment and removal emails. Empty source columns are dropped
// entirely rather than rendering as bare labels.
function renderShiftBody(
  ctx: ShiftContext,
  dayLabel: string,
  timeLabel: string | null
): string {
  const lines: string[] = [];
  lines.push(`  📌 ${ctx.shift_name}: ${ctx.position}`);
  lines.push(`  ${dayLabel}${timeLabel ? ` • ${timeLabel}` : ""}`);
  if (ctx.sap_points != null) {
    lines.push(`  Census Shift Points: ${ctx.sap_points}`);
  }
  if (ctx.critical) {
    lines.push(
      `  **This is a critical position** — many other volunteers depend on you being there.`
    );
  }
  if (notBlank(ctx.shift_details)) {
    lines.push("", "About this shift type:", `  ${ctx.shift_details.trim()}`);
  }
  if (notBlank(ctx.position_details)) {
    lines.push("", "About this position:", `  ${ctx.position_details.trim()}`);
  }
  if (notBlank(ctx.shift_notes)) {
    lines.push("", "Shift notes:", `  ${ctx.shift_notes.trim()}`);
  }
  if (notBlank(ctx.meal)) {
    lines.push("", `Meal: ${ctx.meal.trim()}`);
  }
  return lines.join("\n");
}

function greetingFor(ctx: ShiftContext): string {
  if (notBlank(ctx.playa_name)) return `Hi ${ctx.playa_name.trim()},`;
  if (notBlank(ctx.world_name)) return `Hi ${ctx.world_name.trim()},`;
  return "Hi,";
}

function timeLabelFor(ctx: ShiftContext): string | null {
  const start = ctx.start_time_text ?? ctx.start_time ?? "";
  const end = ctx.end_time_text ?? ctx.end_time ?? "";
  if (!start && !end) return null;
  return `${start}${end ? ` – ${end}` : ""}`;
}

export async function notifyAssignment(
  pool: Pool,
  shiftboardId: number,
  timePositionId: number | string,
  actorShiftboardId: number | null = null
): Promise<void> {
  const [rows] = await pool.query<ShiftContext[]>(SHIFT_CONTEXT_QUERY, [
    shiftboardId,
    timePositionId,
  ]);
  const ctx = rows[0];
  if (!ctx) return;
  if (!ctx.email) {
    console.warn(
      `[assign-notify] skip: shiftboard_id=${shiftboardId} time_position_id=${timePositionId} — no email on file`
    );
    return;
  }

  const dayLabel = ctx.datename ? `${ctx.datename} ${ctx.date}` : ctx.date;
  const timeLabel = timeLabelFor(ctx);
  const isSelfAction =
    actorShiftboardId == null || actorShiftboardId === shiftboardId;
  const actorName = isSelfAction
    ? null
    : await lookupActorDisplayName(pool, actorShiftboardId);

  const opener = isSelfAction
    ? "You're assigned to the following Census shift:"
    : `You were assigned to the following Census shift by ${actorName ?? "an administrator"}:`;

  const bodyText = [
    greetingFor(ctx),
    "",
    opener,
    "",
    renderShiftBody(ctx, dayLabel, timeLabel),
    "",
    "A calendar invite is attached.",
    "",
    `Manage your shifts: ${APP_BASE_URL}/volunteers/${shiftboardId}/info`,
  ].join("\n");

  const icsDate = dateToIcs(ctx.date);
  const icsStart = timeToIcs(ctx.start_time);
  const icsEnd = timeToIcs(ctx.end_time);
  const icsContent =
    icsDate && icsStart && icsEnd
      ? buildIcs({
          uid: shiftIcsUid(shiftboardId, timePositionId),
          summary: `Census: ${ctx.position}`,
          description: bodyText,
          date: icsDate,
          startTime: icsStart,
          endTime: icsEnd,
          method: "PUBLISH",
        })
      : null;

  await enqueueEmail({
    to: ctx.email,
    subject: `Census: assigned to ${ctx.position} on ${dayLabel}`,
    bodyText,
    ics: icsContent
      ? {
          filename: `census-${ctx.position.replace(/\s+/g, "-").toLowerCase()}.ics`,
          content: Buffer.from(icsContent, "utf8"),
        }
      : undefined,
    category: "assignment",
  });
}

// Three distinct removal contexts (see Mew 2026-05-31):
//   - self            — the volunteer themselves dropped the shift
//   - by-other        — an admin / coordinator removed them
//   - shift-canceled  — the whole shift was canceled (Update Time
//                       dialog flips canceled=1); the volunteer didn't
//                       lose just their slot, the slot stopped existing
export type RemovalCause =
  | { kind: "self" }
  | { kind: "by-other"; actorShiftboardId: number | null }
  | { kind: "shift-canceled" };

// Sends a removal email + a CANCEL .ics with the same UID as the
// original assignment, so the volunteer's calendar matches the
// cancellation to the prior event and drops it cleanly.
export async function notifyRemoval(
  pool: Pool,
  shiftboardId: number,
  timePositionId: number | string,
  cause: RemovalCause
): Promise<void> {
  const [rows] = await pool.query<ShiftContext[]>(SHIFT_CONTEXT_QUERY, [
    shiftboardId,
    timePositionId,
  ]);
  const ctx = rows[0];
  if (!ctx) return;
  if (!ctx.email) {
    console.warn(
      `[assign-notify] cancel skip: shiftboard_id=${shiftboardId} time_position_id=${timePositionId} — no email on file`
    );
    return;
  }

  const dayLabel = ctx.datename ? `${ctx.datename} ${ctx.date}` : ctx.date;
  const timeLabel = timeLabelFor(ctx);

  let opener: string;
  let subject: string;
  let calendarLine: string;
  if (cause.kind === "self") {
    opener = "You've removed yourself from the following Census shift:";
    subject = `Census: you dropped ${ctx.position} on ${dayLabel}`;
    calendarLine =
      "A calendar cancellation is attached — your calendar should drop the event automatically.";
  } else if (cause.kind === "shift-canceled") {
    opener = "The following Census shift has been canceled:";
    subject = `Census: ${ctx.shift_name} on ${dayLabel} canceled`;
    calendarLine =
      "A calendar cancellation is attached — your calendar should drop the event automatically.";
  } else {
    const actorName = await lookupActorDisplayName(
      pool,
      cause.actorShiftboardId
    );
    opener = `You were removed from the following Census shift by ${actorName ?? "an administrator"}:`;
    subject = `Census: removed from ${ctx.position} on ${dayLabel}`;
    calendarLine =
      "A calendar cancellation is attached — your calendar should drop the event automatically.";
  }

  const closingLine =
    cause.kind === "shift-canceled"
      ? `Manage your shifts: ${APP_BASE_URL}/volunteers/${shiftboardId}/info`
      : `If this was a mistake, you can re-add yourself: ${APP_BASE_URL}/volunteers/${shiftboardId}/info`;

  const bodyText = [
    greetingFor(ctx),
    "",
    opener,
    "",
    renderShiftBody(ctx, dayLabel, timeLabel),
    "",
    calendarLine,
    "",
    closingLine,
  ].join("\n");

  const icsDate = dateToIcs(ctx.date);
  const icsStart = timeToIcs(ctx.start_time);
  const icsEnd = timeToIcs(ctx.end_time);
  const icsContent =
    icsDate && icsStart && icsEnd
      ? buildIcs({
          uid: shiftIcsUid(shiftboardId, timePositionId),
          summary: `Census: ${ctx.position}`,
          description: bodyText,
          date: icsDate,
          startTime: icsStart,
          endTime: icsEnd,
          method: "CANCEL",
        })
      : null;

  await enqueueEmail({
    to: ctx.email,
    subject,
    bodyText,
    ics: icsContent
      ? {
          filename: `census-${ctx.position.replace(/\s+/g, "-").toLowerCase()}-cancel.ics`,
          content: Buffer.from(icsContent, "utf8"),
        }
      : undefined,
    category:
      cause.kind === "shift-canceled" ? "shift-canceled" : "removal",
  });
}
