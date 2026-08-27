import type { Pool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

import { enqueueEmail } from "lib/mail";

import {
  COORDINATOR_EMAIL,
  ShiftAgg,
  ShiftLine,
  buildConsolidatedEmail,
  buildNudgeEmail,
  evaluateShift,
} from "./shiftLeadNudge.logic";

// Shift-lead nudge I/O runner: ~1h after a shift ends, email its leads (or the
// coordinator list for a leadless shift) if it qualifies, finalize every
// still-pending volunteer (leads included) to no-show, and mark the shift so
// it's nudged only once. Pure decision/content logic lives in
// shiftLeadNudge.logic.ts. See migration 016.

// Only nudge shifts that ended within this many hours (upper bound) so a first
// run / recovered outage doesn't blast nudges for ancient shifts. Lower bound is
// always 1h (the "1 hour after it ends" rule).
const MAX_AGE_HOURS = Number(process.env.NUDGE_MAX_AGE_HOURS ?? 24);

interface VolRow extends RowDataPacket {
  id: number;
  shift_name: string;
  date: string | null;
  stt: string | null;
  ett: string | null;
  is_lead: number | null;
  playa_name: string | null;
  world_name: string | null;
  email: string | null;
  noshow: string | null;
  rating: number | null;
}

// Fetch every not-yet-nudged shift that ended >1h ago (playa time), optionally
// capped to shifts that ended within maxAgeHours (null = no cap, used by the
// one-time catch-up), one row per assigned volunteer, grouped into ShiftAgg.
async function loadCandidateShifts(
  pool: Pool,
  maxAgeHours: number | null
): Promise<ShiftAgg[]> {
  // maxAgeHours is a trusted numeric config value; coerce before interpolating.
  const upperBound =
    maxAgeHours != null
      ? `AND DATE_ADD(st.end_time, INTERVAL ${Number(maxAgeHours)} HOUR)
             > CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles')`
      : "";
  const [rows] = await pool.query<VolRow[]>(
    `SELECT st.shift_times_id AS id, sn.shift_name, d.date,
            st.start_time_text AS stt, st.end_time_text AS ett,
            pt.\`lead\` AS is_lead, v.playa_name, v.world_name, v.email,
            vs.noshow, vs.rating
       FROM op_shift_times st
       JOIN op_shift_name sn
         ON sn.shift_name_id = st.shift_name_id AND sn.delete_shift = false
       LEFT JOIN op_dates d ON d.date_id = st.start_date_id
       JOIN op_shift_time_position stp
         ON stp.shift_times_id = st.shift_times_id AND stp.remove_time_position = false
       JOIN op_position_type pt
         ON pt.position_type_id = stp.position_type_id AND pt.delete_position = false
       JOIN op_volunteer_shifts vs
         ON vs.time_position_id = stp.time_position_id
        AND vs.remove_shift = false AND vs.shiftboard_id > 0
       LEFT JOIN op_volunteers v ON v.shiftboard_id = vs.shiftboard_id
       LEFT JOIN op_shift_lead_nudge n ON n.shift_times_id = st.shift_times_id
      WHERE st.remove_shift_time = false AND st.canceled = false
        AND n.shift_times_id IS NULL
        AND DATE_ADD(st.end_time, INTERVAL 1 HOUR)
              < CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles')
        ${upperBound}
      ORDER BY st.shift_times_id`
  );

  const byShift = new Map<number, ShiftAgg>();
  const leadEmailSet = new Map<number, Set<string>>();
  for (const r of rows) {
    if (!byShift.has(r.id)) {
      byShift.set(r.id, {
        id: r.id,
        name: r.shift_name,
        date: r.date,
        time: `${r.stt ?? ""}-${r.ett ?? ""}`,
        leadEmails: [],
        nonLeads: [],
      });
      leadEmailSet.set(r.id, new Set());
    }
    const agg = byShift.get(r.id)!;
    if (r.is_lead === 1) {
      if (r.email) leadEmailSet.get(r.id)!.add(r.email);
    } else {
      agg.nonLeads.push({
        playaName: r.playa_name ?? "",
        worldName: r.world_name ?? "",
        checkedIn: r.noshow === "",
        reviewed: r.rating != null && r.rating > 0,
      });
    }
  }
  for (const [id, set] of leadEmailSet) byShift.get(id)!.leadEmails = [...set];
  return [...byShift.values()];
}

export interface NudgeRunResult {
  scanned: number;
  nudged: Array<{
    id: number;
    name: string;
    to: string[];
    reasons: string[];
    finalized: number;
  }>;
  dryRun: boolean;
}

// Finalize a shift (every still-pending 'X'/NULL volunteer, leads included, ->
// 'Yes' no-show) and mark it nudged so it never repeats. Returns rows finalized.
async function finalizeAndMark(pool: Pool, shiftId: number): Promise<number> {
  const [res] = await pool.query(
    `UPDATE op_volunteer_shifts vs
       JOIN op_shift_time_position stp
         ON stp.time_position_id = vs.time_position_id
        AND stp.remove_time_position = false
        SET vs.noshow = 'Yes', vs.update_shift = true
      WHERE stp.shift_times_id = ?
        AND vs.remove_shift = false
        AND (vs.noshow IS NULL OR vs.noshow = 'X')`,
    [shiftId]
  );
  await pool.query(
    `INSERT IGNORE INTO op_shift_lead_nudge (shift_times_id) VALUES (?)`,
    [shiftId]
  );
  return (res as { affectedRows?: number }).affectedRows ?? 0;
}

function reasonsOf(ev: ReturnType<typeof evaluateShift>): string[] {
  return [
    ev.condA ? `${ev.unreviewed.length} unreviewed` : null,
    ev.condB ? `${ev.pctCheckedIn}% checked in` : null,
  ].filter(Boolean) as string[];
}

// Steady-state (every ~15 min): one email PER qualifying shift that ended within
// the 24h window. dryRun reports what it WOULD do without sending or writing.
export async function runShiftLeadNudge(
  pool: Pool,
  opts: { dryRun?: boolean } = {}
): Promise<NudgeRunResult> {
  const dryRun = Boolean(opts.dryRun);
  const shifts = await loadCandidateShifts(pool, MAX_AGE_HOURS);
  const nudged: NudgeRunResult["nudged"] = [];

  for (const agg of shifts) {
    const ev = evaluateShift(agg);
    if (!ev.shouldNudge) continue;

    const to = agg.leadEmails.length ? agg.leadEmails : [COORDINATOR_EMAIL];
    const cc = agg.leadEmails.length ? [COORDINATOR_EMAIL] : undefined;

    let finalized = 0;
    if (!dryRun) {
      const { subject, bodyText, bodyHtml } = buildNudgeEmail(agg, ev);
      try {
        await enqueueEmail({ to, cc, subject, bodyText, bodyHtml, category: "shift-lead-nudge" });
      } catch (err) {
        console.error(`[shift-lead-nudge] enqueue failed for #${agg.id}:`, err);
      }
      finalized = await finalizeAndMark(pool, agg.id);
    }
    nudged.push({ id: agg.id, name: agg.name, to, reasons: reasonsOf(ev), finalized });
  }
  return { scanned: shifts.length, nudged, dryRun };
}

export interface CatchupRunResult {
  scannedShifts: number;
  emails: Array<{ to: string; shiftCount: number; shiftIds: number[] }>;
  shiftsNudged: number;
  finalized: number;
  dryRun: boolean;
}

// One-time catch-up: no age cap. Groups every qualifying shift by recipient and
// sends ONE consolidated email per lead (each of their shifts) — leadless shifts
// go to the coordinator list. Every email CCs coordinators. Each shift is
// finalized + marked exactly once even if it has multiple leads.
export async function runShiftLeadNudgeCatchup(
  pool: Pool,
  opts: { dryRun?: boolean } = {}
): Promise<CatchupRunResult> {
  const dryRun = Boolean(opts.dryRun);
  const shifts = await loadCandidateShifts(pool, null);

  // recipient email -> lines; leadless shifts collect under COORDINATOR_EMAIL.
  const byRecipient = new Map<string, ShiftLine[]>();
  const qualifying: ShiftAgg[] = [];
  for (const agg of shifts) {
    const ev = evaluateShift(agg);
    if (!ev.shouldNudge) continue;
    qualifying.push(agg);
    const recipients = agg.leadEmails.length ? agg.leadEmails : [COORDINATOR_EMAIL];
    for (const r of recipients) {
      if (!byRecipient.has(r)) byRecipient.set(r, []);
      byRecipient.get(r)!.push({ agg, ev });
    }
  }

  const emails: CatchupRunResult["emails"] = [];
  for (const [recipient, lines] of byRecipient) {
    emails.push({ to: recipient, shiftCount: lines.length, shiftIds: lines.map((l) => l.agg.id) });
    if (!dryRun) {
      const isCoord = recipient === COORDINATOR_EMAIL;
      const { subject, bodyText, bodyHtml } = buildConsolidatedEmail(isCoord, lines);
      try {
        await enqueueEmail({
          to: recipient,
          cc: isCoord ? undefined : [COORDINATOR_EMAIL],
          subject,
          bodyText,
          bodyHtml,
          category: "shift-lead-nudge-catchup",
        });
      } catch (err) {
        console.error(`[shift-lead-nudge] catch-up enqueue failed for ${recipient}:`, err);
      }
    }
  }

  let finalized = 0;
  if (!dryRun) {
    for (const agg of qualifying) finalized += await finalizeAndMark(pool, agg.id);
  }

  return {
    scannedShifts: shifts.length,
    emails,
    shiftsNudged: qualifying.length,
    finalized,
    dryRun,
  };
}
