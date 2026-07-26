import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Pool } from "mysql2/promise";

// A SAP only fires once op_volunteers.arrival_date_id is set, but that column is
// otherwise written only by the manual "arrival day" form. When a volunteer has
// a SAP-eligible shift, set their arrival to the day BEFORE their first eligible
// shift — but only if it's currently NULL or LATER than that day, so we never
// move an earlier, self-chosen arrival. arrival_auto_set records that we set it
// so the UI can show a "we set this, adjust if you're arriving earlier" header.
//
// Best-effort: callers wrap it so a failure never fails the signup. Returns true
// when it changed the arrival date. See migration 009.
export const autoSetArrival = async (
  pool: Pool,
  shiftboardId: number
): Promise<boolean> => {
  // 1. first SAP-eligible shift date for this volunteer.
  // "SAP-eligible" = a shift starting on OpenSun (gates-open Sunday) or EARLIER
  // (Mew 2026-07-26): those require entering before the gates open, so they get
  // a SAP. Shifts starting Mon or later need no early entry and must NOT trigger
  // the auto-set. ponytail: anchor off the OpenSun datename rather than a
  // hardcoded date, so it survives year rollovers like the rest of the app.
  const [firstRows] = await pool.query<RowDataPacket[]>(
    `SELECT MIN(d.date) AS first_date
       FROM op_volunteer_shifts vs
       JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
       JOIN op_shift_times st ON stp.shift_times_id = st.shift_times_id
       JOIN op_dates d ON st.start_date_id = d.date_id
      WHERE vs.shiftboard_id = ?
        AND vs.remove_shift = false
        AND stp.remove_time_position = false
        AND st.remove_shift_time = false
        AND d.date <= (SELECT date FROM op_dates WHERE datename = 'OpenSun' LIMIT 1)`,
    [shiftboardId]
  );
  const firstDate = firstRows[0]?.first_date;
  if (!firstDate) return false; // no OpenSun-or-earlier shift → not SAP-eligible

  // 2. target = day before that shift. Look up its date_id; if the day-before
  // isn't a known event day (e.g. the shift is on the earliest date), fall back
  // to the shift day itself so a pass still fires.
  // ponytail: exact-date match + one day-of fallback; no calendar-table math.
  const [targetRows] = await pool.query<RowDataPacket[]>(
    `SELECT date_id, date FROM op_dates
      WHERE date IN (DATE_SUB(?, INTERVAL 1 DAY), ?)
      ORDER BY date ASC
      LIMIT 1`,
    [firstDate, firstDate]
  );
  const target = targetRows[0];
  if (!target) return false; // shift day not in op_dates (shouldn't happen)

  // 3. only set when NULL or later than target (never move an earlier arrival)
  const [curRows] = await pool.query<RowDataPacket[]>(
    `SELECT v.arrival_date_id, d.date AS arrival_date
       FROM op_volunteers v
       LEFT JOIN op_dates d ON v.arrival_date_id = d.date_id
      WHERE v.shiftboard_id = ?`,
    [shiftboardId]
  );
  const cur = curRows[0];
  if (!cur) return false;
  const needsSet =
    cur.arrival_date_id == null ||
    new Date(cur.arrival_date) > new Date(target.date);
  if (!needsSet) return false;

  await pool.query<ResultSetHeader>(
    `UPDATE op_volunteers
        SET arrival_date_id = ?, arrival_auto_set = 1, update_volunteer = true
      WHERE shiftboard_id = ?`,
    [target.date_id, shiftboardId]
  );
  return true;
};
