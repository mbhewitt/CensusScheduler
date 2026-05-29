import type { Pool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

import { enqueueEmail } from "lib/mail";

// #309 — when a volunteer is assigned to a shift (admin or self),
// email them with the details + an .ics so the event lands in their
// calendar. UID is deterministic so re-assigns update rather than
// duplicate. Best-effort: a failure here doesn't fail the POST.

const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://volunteers.census.burningman.org";
const CALENDAR_TZID = "America/Los_Angeles";

interface AssignmentContext extends RowDataPacket {
  position: string;
  critical: number;
  shift_name: string;
  department: string | null;
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

// HHMMSS string from "HH:MM:SS" or "HH:MM"; null if not parseable.
// We intentionally don't import a TZ lib — the values stored in the DB
// are already wall-clock America/Los_Angeles per the dump convention.
function timeToIcs(t: string | null): string | null {
  if (!t) return null;
  const m = t.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3] ?? "00"}`;
}

// YYYY-MM-DD → YYYYMMDD
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

// Long-line fold per RFC 5545 (lines must be ≤75 octets; continuation
// lines begin with a single space). Conservatively folds on character
// boundaries — adequate for the ASCII-ish content we emit.
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
}): string {
  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Census Scheduler//Census Shift//EN",
    "METHOD:REQUEST",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${args.uid}`,
    `DTSTAMP:${nowUtcStamp()}`,
    `DTSTART;TZID=${CALENDAR_TZID}:${args.date}T${args.startTime}`,
    `DTEND;TZID=${CALENDAR_TZID}:${args.date}T${args.endTime}`,
    `SUMMARY:${escape(args.summary)}`,
    `DESCRIPTION:${escape(args.description)}`,
    "LOCATION:Black Rock City",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n");
}

export async function notifyAssignment(
  pool: Pool,
  shiftboardId: number,
  timePositionId: number | string
): Promise<void> {
  const [rows] = await pool.query<AssignmentContext[]>(
    `SELECT
       pt.position,
       pt.critical,
       sn.shift_name,
       sc.department,
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
     LEFT JOIN op_shift_category sc
       ON sc.shift_category_id = sn.shift_category_id
     LEFT JOIN op_dates d
       ON d.date_id = st.start_date_id
     LEFT JOIN op_volunteers v
       ON v.shiftboard_id = vs.shiftboard_id
     WHERE vs.shiftboard_id = ?
       AND vs.time_position_id = ?
     LIMIT 1`,
    [shiftboardId, timePositionId]
  );
  const ctx = rows[0];
  if (!ctx) return;
  if (!ctx.email) {
    console.warn(
      `[assign-notify] skip: shiftboard_id=${shiftboardId} time_position_id=${timePositionId} — no email on file`
    );
    return;
  }

  const dayLabel = ctx.datename ? `${ctx.datename} ${ctx.date}` : ctx.date;
  const greeting = ctx.playa_name
    ? `Hi ${ctx.playa_name},`
    : ctx.world_name
      ? `Hi ${ctx.world_name},`
      : "Hi,";
  const startStr = ctx.start_time_text ?? ctx.start_time ?? "";
  const endStr = ctx.end_time_text ?? ctx.end_time ?? "";
  const timeLine =
    startStr || endStr
      ? `Time: ${startStr}${endStr ? ` – ${endStr}` : ""}`
      : null;
  const criticalCallout = ctx.critical
    ? "**This is a critical position** — many other volunteers depend on you being there. If you can't make it, please update your shifts in the app and let a volunteer coordinator know."
    : null;

  const bodyText = [
    greeting,
    "",
    "You've been assigned to the following Census shift:",
    "",
    `  Position: ${ctx.position}`,
    `  Day: ${dayLabel}`,
    ...(timeLine ? [`  ${timeLine}`] : []),
    `  Category: ${ctx.department ?? ctx.shift_name}`,
    ...(criticalCallout ? ["", criticalCallout] : []),
    "",
    "A calendar invite is attached.",
    "",
    `View or change your shifts: ${APP_BASE_URL}/volunteers/${shiftboardId}/info`,
  ].join("\n");

  // .ics is best-effort — skip the attachment if we can't get clean
  // times. Calendar-event-less email still has the textual details.
  const icsDate = dateToIcs(ctx.date);
  const icsStart = timeToIcs(ctx.start_time);
  const icsEnd = timeToIcs(ctx.end_time);
  const icsContent =
    icsDate && icsStart && icsEnd
      ? buildIcs({
          uid: `census-shift-${timePositionId}-${shiftboardId}@volunteers.census.burningman.org`,
          summary: `Census: ${ctx.position}`,
          description: bodyText,
          date: icsDate,
          startTime: icsStart,
          endTime: icsEnd,
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
