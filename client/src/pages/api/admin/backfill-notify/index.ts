import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { notifyAssignment } from "@/components/api/assignmentNotify";
import { withAuth } from "@/lib/withAuth";
import { ROLE_ADMIN_ID, ROLE_SUPER_ADMIN_ID } from "@/constants";
import { pool } from "lib/database";

// One-off admin tool used to backfill assignment emails for shifts
// that were filled before the #309 notify path went live. Hits
// notifyAssignment (same code path as a fresh assign) for every
// matching (shiftboard_id, time_position_id) row, which queues a
// REQUEST .ics email per row. The mail worker rate-limits to
// 1/minute + 100/day, so a bulk call here just stuffs the queue
// and the worker drains at the configured rate — exactly the
// "slowly" cadence Mew asked for 2026-05-31.
//
// Modes (query string):
//   ?shiftboardId=N  — single volunteer's current assignments
//   (no param)       — all currently-assigned, non-canceled,
//                      non-removed (shiftboard_id, time_position_id)
//
// Guard: requires the caller to have SuperAdmin (1) or Admin (2)
// in op_volunteer_roles. Returns 403 otherwise.

const backfillNotify = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "POST") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }

  const [roleRows] = await pool.query<RowDataPacket[]>(
    `SELECT role_id FROM op_volunteer_roles
     WHERE shiftboard_id = ?
       AND role_id IN (?, ?)`,
    [session.shiftboardId, ROLE_SUPER_ADMIN_ID, ROLE_ADMIN_ID]
  );
  if (roleRows.length === 0) {
    return res
      .status(403)
      .json({ statusCode: 403, message: "Admin role required" });
  }

  const shiftboardIdParam = req.query.shiftboardId;
  const targetShiftboardId =
    typeof shiftboardIdParam === "string" && shiftboardIdParam.length > 0
      ? Number(shiftboardIdParam)
      : null;

  // Active assignments only — joining op_shift_times so we can skip
  // canceled shifts (no point re-confirming an assignment to a shift
  // that was just canceled), and filter out removed assignments.
  const baseSql = `
    SELECT vs.shiftboard_id, vs.time_position_id
    FROM op_volunteer_shifts vs
    JOIN op_shift_time_position stp
      ON stp.time_position_id = vs.time_position_id
    JOIN op_shift_times st
      ON st.shift_times_id = stp.shift_times_id
    WHERE vs.remove_shift = false
      AND st.canceled = false
      AND st.remove_shift_time = false
  `;
  const where = targetShiftboardId != null ? " AND vs.shiftboard_id = ?" : "";
  const params = targetShiftboardId != null ? [targetShiftboardId] : [];
  const [rows] = await pool.query<RowDataPacket[]>(
    `${baseSql}${where}`,
    params
  );

  let enqueued = 0;
  const failures: Array<{
    shiftboardId: number;
    timePositionId: number;
    error: string;
  }> = [];
  for (const r of rows) {
    try {
      // actorShiftboardId = null → opener stays "You're assigned to..."
      // (the backfill isn't a fresh admin action; the volunteers are
      // already on the shift).
      await notifyAssignment(
        pool,
        r.shiftboard_id,
        r.time_position_id,
        null
      );
      enqueued += 1;
    } catch (err) {
      failures.push({
        error: err instanceof Error ? err.message : String(err),
        shiftboardId: r.shiftboard_id,
        timePositionId: r.time_position_id,
      });
    }
  }

  return res.status(200).json({
    enqueued,
    failures,
    statusCode: 200,
    totalMatched: rows.length,
  });
};

export default withAuth(backfillNotify);
