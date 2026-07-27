import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withAuth } from "@/lib/withAuth";
import {
  ROLE_ADMIN_ID,
  ROLE_PEERS_COORDINATOR_ID,
  ROLE_PEERS_SHIFT_LEAD_ID,
  ROLE_SUPER_ADMIN_ID,
} from "@/constants";
import { pool } from "lib/database";

// PEERS Tablet Report CSV export (papabear 2026-07-26).
//
// One row per shift assignment on a tablet-carrying shift (Squaddie or Shift
// Lead), so leadership can reconcile who has which tablet and reach the camp /
// contact info captured on the Tablet Responsibility Agreement. Coordinator
// shifts (PCoC / PCiO) don't carry tablets and are excluded.
//
// Columns: Shift / Tablet # / Name / Playa name / Email / Camp name /
// Camp address / Phone / Landmark / Open Camping.
//
// Guard: SuperAdmin (1), Admin (2), PEERS Coordinator, or PEERS Shift Lead —
// "Shift Leads & up" (papabear). Returns 403 otherwise.

// Wrap a value for CSV: quote and escape embedded quotes, and neutralize a
// leading =+-@ (spreadsheet formula injection) in free-text fields.
const csvCell = (value: string | number | null | undefined): string => {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

const tabletReport = async (
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
       AND role_id IN (?, ?, ?, ?)
       AND remove_role = false`,
    [
      session.shiftboardId,
      ROLE_SUPER_ADMIN_ID,
      ROLE_ADMIN_ID,
      ROLE_PEERS_COORDINATOR_ID,
      ROLE_PEERS_SHIFT_LEAD_ID,
    ]
  );
  if (roleRows.length === 0) {
    return res.status(403).json({
      statusCode: 403,
      message: "Shift Lead, Coordinator, or Admin role required",
    });
  }

  // One row per current assignment on a Squaddie/Lead (tablet-carrying) shift.
  // Camp / contact fields live on op_volunteers; tablet # lives on the shift
  // assignment (op_volunteer_shifts). Shift label mirrors the participation
  // report's format.
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
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
           ELSE sn.shift_name
         END
       ) AS shift_label,
       v.world_name,
       v.playa_name,
       v.email,
       v.camp_name,
       v.camp_address,
       v.phone,
       vs.tablet_number,
       v.location,
       v.open_camping
     FROM op_volunteer_shifts vs
     JOIN op_volunteers v
       ON v.shiftboard_id = vs.shiftboard_id
     LEFT JOIN op_shift_time_position stp
       ON stp.time_position_id = vs.time_position_id
     LEFT JOIN op_shift_times st
       ON st.shift_times_id = stp.shift_times_id
     LEFT JOIN op_shift_name sn
       ON sn.shift_name_id = st.shift_name_id
     LEFT JOIN op_dates d
       ON d.date_id = st.start_date_id
     WHERE vs.remove_shift = false
       AND v.delete_volunteer = false
       AND (sn.shift_name LIKE '%Squaddie%' OR sn.shift_name LIKE '%Lead%')
     ORDER BY d.date, st.start_time_text, v.playa_name`
  );

  const header = [
    "Shift",
    "Tablet #",
    "Name",
    "Playa name",
    "Email",
    "Camp name",
    "Camp address",
    "Phone",
    "Landmark",
    "Open Camping",
  ];
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((r) =>
      [
        r.shift_label,
        r.tablet_number,
        r.world_name,
        r.playa_name,
        r.email,
        r.camp_name,
        r.camp_address,
        r.phone,
        r.location,
        r.open_camping ? "Yes" : "",
      ]
        .map(csvCell)
        .join(",")
    ),
  ];
  // Leading BOM so Excel opens the UTF-8 file with the right encoding.
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="peers-tablet-report.csv"`
  );
  return res.status(200).send(csv);
};

export default withAuth(tabletReport);
