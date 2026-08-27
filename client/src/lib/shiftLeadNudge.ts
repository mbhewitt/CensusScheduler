import type { Pool } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

import { enqueueEmail } from "lib/mail";

import {
  COORDINATOR_EMAIL,
  ShiftAgg,
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

// Fetch every not-yet-nudged shift that ended between 1h and MAX_AGE_HOURS ago
// (playa time), one row per assigned volunteer, and group into ShiftAgg.
async function loadCandidateShifts(pool: Pool): Promise<ShiftAgg[]> {
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
        AND DATE_ADD(st.end_time, INTERVAL ? HOUR)
              > CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles')
      ORDER BY st.shift_times_id`,
    [MAX_AGE_HOURS]
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

// Main entry: evaluate candidate shifts, then email + finalize + mark the ones
// that qualify. dryRun reports what it WOULD do without sending or writing.
export async function runShiftLeadNudge(
  pool: Pool,
  opts: { dryRun?: boolean } = {}
): Promise<NudgeRunResult> {
  const dryRun = Boolean(opts.dryRun);
  const shifts = await loadCandidateShifts(pool);
  const nudged: NudgeRunResult["nudged"] = [];

  for (const agg of shifts) {
    const ev = evaluateShift(agg);
    if (!ev.shouldNudge) continue;

    const to = agg.leadEmails.length ? agg.leadEmails : [COORDINATOR_EMAIL];
    // Every email CCs the coordinator list — unless it's already the TO.
    const cc = agg.leadEmails.length ? [COORDINATOR_EMAIL] : undefined;
    const reasons = [
      ev.condA ? `${ev.unreviewed.length} unreviewed` : null,
      ev.condB ? `${ev.pctCheckedIn}% checked in` : null,
    ].filter(Boolean) as string[];

    let finalized = 0;
    if (!dryRun) {
      const { subject, bodyText, bodyHtml } = buildNudgeEmail(agg, ev);
      // Best-effort enqueue (the mail queue handles delivery + retries).
      try {
        await enqueueEmail({
          to,
          cc,
          subject,
          bodyText,
          bodyHtml,
          category: "shift-lead-nudge",
        });
      } catch (err) {
        console.error(`[shift-lead-nudge] enqueue failed for #${agg.id}:`, err);
      }
      // Finalize: every still-pending ('X'/NULL) volunteer on the shift ->
      // 'Yes' (no-show). Includes LEADS who never checked in (per Mew) — the
      // A/B conditions above only measure non-leads, but a no-show lead is still
      // a no-show. Leaves '' (checked in) and existing 'Yes' untouched.
      const [res] = await pool.query(
        `UPDATE op_volunteer_shifts vs
           JOIN op_shift_time_position stp
             ON stp.time_position_id = vs.time_position_id
            AND stp.remove_time_position = false
            SET vs.noshow = 'Yes', vs.update_shift = true
          WHERE stp.shift_times_id = ?
            AND vs.remove_shift = false
            AND (vs.noshow IS NULL OR vs.noshow = 'X')`,
        [agg.id]
      );
      finalized = (res as { affectedRows?: number }).affectedRows ?? 0;
      // Mark nudged so it never repeats.
      await pool.query(
        `INSERT IGNORE INTO op_shift_lead_nudge (shift_times_id) VALUES (?)`,
        [agg.id]
      );
    }

    nudged.push({ id: agg.id, name: agg.name, to, reasons, finalized });
  }

  return { scanned: shifts.length, nudged, dryRun };
}
