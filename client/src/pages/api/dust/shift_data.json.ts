import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { readScopedToken } from "@/lib/session";
import { pool } from "lib/database";

// Dust shift import (#798). Same contract as Volunteeripate's
// /shift_data.json, which Dust already consumes: Bearer token from
// /api/dust, response is an array of
//   { shift_title, shift_start, shift_end (unix s), department_title,
//     shift_description, shift_location, dust_id }
// Dust shows department_title as the reminder's location and ignores
// shift_location. Each Dust sync replaces the previous import, so leaving
// canceled shifts out is what removes them from Dust.
// Errors are 200 + { error } because Dust only surfaces data.error to the
// user; any non-200 shows a generic "Failed to get shifts".
// ponytail: no CORS — Dust calls this via native CapacitorHttp. Add CORS +
// OPTIONS if Dust's web build ever needs it.

// start_time/end_time are "YYYY-MM-DD HH:MM" wall clock in Pacific time.
const toUtc = (col: string) =>
  `CONVERT_TZ(STR_TO_DATE(${col}, '%Y-%m-%d %H:%i'), 'America/Los_Angeles', 'UTC')`;

const shiftData = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }

  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const session = readScopedToken("dust", token);
  if (!session) {
    return res.status(200).json({
      error: "Your Census sign-in has expired. Please sync again.",
    });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
      sn.shift_name,
      COALESCE(NULLIF(stp.position_alias, ''), pt.position) AS position,
      sn.shift_details,
      pt.position_details,
      TIMESTAMPDIFF(SECOND, '1970-01-01', ${toUtc("st.start_time")}) AS shift_start,
      TIMESTAMPDIFF(SECOND, '1970-01-01', ${toUtc("st.end_time")}) AS shift_end
    FROM op_volunteer_shifts AS vs
    JOIN op_shift_time_position AS stp
    ON stp.time_position_id=vs.time_position_id
    AND stp.remove_time_position=false
    JOIN op_position_type AS pt
    ON pt.position_type_id=stp.position_type_id
    JOIN op_shift_times AS st
    ON st.shift_times_id=stp.shift_times_id
    AND st.remove_shift_time=false
    AND st.canceled=false
    JOIN op_shift_name AS sn
    ON sn.shift_name_id=st.shift_name_id
    WHERE vs.remove_shift=false
    AND vs.shiftboard_id=?
    AND ${toUtc("st.end_time")} > UTC_TIMESTAMP()
    ORDER BY shift_start`,
    [session.shiftboardId]
  );

  return res.status(200).json(
    rows.map((row) => ({
      shift_title: `${row.shift_name} – ${row.position}`,
      shift_start: Number(row.shift_start),
      shift_end: Number(row.shift_end),
      department_title: "BRC Census",
      shift_description: [row.shift_details, row.position_details]
        .filter(Boolean)
        .join("\n\n"),
      shift_location: "",
      dust_id: "",
    }))
  );
};

export default shiftData;
