import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withAuth } from "@/lib/withAuth";
import { ROLE_ADMIN_ID, ROLE_SUPER_ADMIN_ID } from "@/constants";
import { pool } from "lib/database";

// Admin-only PEERS Participation Points (PPP) audit export.
//
// Produces a CSV — one row per volunteer who signed up for at least one
// shift — with their contact info, how many shifts they signed up for,
// how many they actually checked in for, and the total PPP earned for the
// shifts they COMPLETED (checked in). Points are only credited for
// checked-in shifts (noshow=''), per papabear 2026-07-17: the points count
// toward earning a ticket the following year and are tallied in this
// post-event audit, outside the scheduler.
//
// Guard: requires SuperAdmin (1) or Admin (2) in op_volunteer_roles.
// Returns 403 otherwise.

// Wrap a value for CSV: quote and escape embedded quotes. Guards against a
// stray comma / newline / leading =+-@ (spreadsheet formula injection) in
// free-text fields like playa/world name.
const csvCell = (value: string | number | null | undefined): string => {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

const participationReport = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
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

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       v.playa_name,
       v.world_name,
       v.email,
       v.phone,
       COUNT(DISTINCT CASE
         WHEN vs.remove_shift = false THEN vs.time_position_id
       END) AS signed_up_count,
       COUNT(DISTINCT CASE
         WHEN vs.remove_shift = false AND vs.noshow = '' THEN vs.time_position_id
       END) AS checked_in_count,
       COALESCE(SUM(CASE
         WHEN vs.remove_shift = false
           AND vs.noshow = ''
           AND stp.remove_time_position = false
         THEN stp.sap_points ELSE 0
       END), 0) AS points_earned,
       GROUP_CONCAT(
         CASE WHEN vs.remove_shift = false AND vs.noshow = '' THEN
           CONCAT_WS(' ',
             CONCAT(COALESCE(d.datename, ''), ' ',
               COALESCE(DATE_FORMAT(d.date, '%c/%e'), '')),
             CONCAT(
               LOWER(TIME_FORMAT(STR_TO_DATE(st.start_time_text, '%H:%i'), '%l:%i%p')),
               '-',
               LOWER(TIME_FORMAT(STR_TO_DATE(st.end_time_text, '%H:%i'), '%l:%i%p'))
             ),
             CASE
               WHEN sn.shift_name LIKE '%Lead%' THEN 'Shift Lead'
               WHEN sn.shift_name LIKE '%Squaddie%' THEN 'Squaddie'
               WHEN sn.shift_name LIKE '%PCoC%'
                 OR sn.shift_name LIKE '%On Call%' THEN 'PCoC'
               WHEN sn.shift_name LIKE '%PCiO%'
                 OR sn.shift_name LIKE '%in Office%' THEN 'PCiO'
               ELSE sn.shift_name
             END
           )
         END
         ORDER BY d.date, st.start_time_text
         SEPARATOR '; '
       ) AS shifts_worked
     FROM op_volunteers v
     JOIN op_volunteer_shifts vs
       ON vs.shiftboard_id = v.shiftboard_id
     LEFT JOIN op_shift_time_position stp
       ON stp.time_position_id = vs.time_position_id
     LEFT JOIN op_shift_times st
       ON st.shift_times_id = stp.shift_times_id
     LEFT JOIN op_shift_name sn
       ON sn.shift_name_id = st.shift_name_id
     LEFT JOIN op_dates d
       ON d.date_id = st.start_date_id
     WHERE v.delete_volunteer = false
     GROUP BY v.shiftboard_id, v.playa_name, v.world_name, v.email, v.phone
     HAVING signed_up_count > 0
     ORDER BY points_earned DESC, v.playa_name`
  );

  const header = [
    "Playa Name",
    "World Name",
    "Email",
    "Phone",
    "Shifts Signed Up",
    "Shifts Checked In",
    "Participation Points (PPP) Earned",
    "Shifts Worked (checked in)",
  ];
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((r) =>
      [
        r.playa_name,
        r.world_name,
        r.email,
        r.phone,
        r.signed_up_count,
        r.checked_in_count,
        r.points_earned,
        r.shifts_worked,
      ]
        .map(csvCell)
        .join(",")
    ),
  ];
  // Prepend a UTF-8 BOM so Excel opens accented playa names correctly.
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="peers-participation-points.csv"`
  );
  return res.status(200).send(csv);
};

export default withAuth(participationReport);
