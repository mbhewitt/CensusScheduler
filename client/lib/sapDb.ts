// DB-backed SAP helpers. Pure logic lives in lib/sap.ts (unit-tested); this file
// wraps it with the queries the SAP endpoints share.
import type { RowDataPacket } from "mysql2";

import { pool } from "lib/database";

import { modeBurnYear } from "./sap";

// The current event's burn year, derived from op_dates (see lib/sap.ts). Null
// when op_dates is empty.
export async function getCurrentBurnYear(): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT \`date\` FROM op_dates`);
  return modeBurnYear(rows.map((r) => String(r.date)));
}

// The date ("YYYY-MM-DD") of a volunteer's first CSP-bearing shift, or null.
// Shifts worth 0 CSP (sap_points = 0) do NOT count toward SAP eligibility, so
// they're excluded here — this is the corrected "first shift" used for Auto.
export async function getFirstCspShiftDate(
  shiftboardId: number,
): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT MIN(d.\`date\`) AS first_date
       FROM op_volunteer_shifts vs
       JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
       JOIN op_shift_times st ON stp.shift_times_id = st.shift_times_id
       JOIN op_dates d ON st.start_date_id = d.date_id
      WHERE vs.shiftboard_id = ?
        AND vs.remove_shift = false
        AND stp.remove_time_position = false
        AND st.remove_shift_time = false
        AND COALESCE(stp.sap_points, 0) > 0`,
    [shiftboardId],
  );
  const v = rows[0]?.first_date;
  return v ? String(v) : null;
}
