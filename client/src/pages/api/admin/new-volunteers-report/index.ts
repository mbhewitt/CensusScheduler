import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withAuth } from "@/lib/withAuth";
import {
  ROLE_ADMIN_ID,
  ROLE_PEERS_COORDINATOR_ID,
  ROLE_PEERS_SHIFT_LEAD_ID,
  ROLE_PEERS_SQUADDIE_ID,
  ROLE_SUPER_ADMIN_ID,
} from "@/constants";
import { pool } from "lib/database";

// PEERS #walkin — "New Volunteers for Mailing List" CSV export.
//
// One row per volunteer who created an account on the scheduler
// (create_volunteer=true — self-register OR Burner Profile sign-in) but has
// NOT completed HIVE training, i.e. holds neither the Squaddie nor the Shift
// Lead access role. This captures off-playa Burner-Profile signups AND
// on-playa walk-ins who arrived without going through a HIVE link (papabear,
// scope B, 2026-07-24) so they can be added to a mailing list.
//
// Columns: signed-up timestamp (created_at — blank for accounts that predate
// migration 007), name (world/legal name), playa name, email.
//
// Guard: admin/superadmin OR PEERS Coordinator. Returns 403 otherwise.

// Wrap a value for CSV: quote and escape embedded quotes, and neutralize a
// leading =+-@ (spreadsheet formula injection) in free-text fields.
const csvCell = (value: string | number | null | undefined): string => {
  const raw = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

const newVolunteersReport = async (
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
       AND role_id IN (?, ?, ?)
       AND remove_role = false`,
    [
      session.shiftboardId,
      ROLE_SUPER_ADMIN_ID,
      ROLE_ADMIN_ID,
      ROLE_PEERS_COORDINATOR_ID,
    ]
  );
  if (roleRows.length === 0) {
    return res.status(403).json({
      statusCode: 403,
      message: "Admin or Coordinator role required",
    });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       v.created_at,
       v.world_name,
       v.playa_name,
       v.email
     FROM op_volunteers AS v
     WHERE v.delete_volunteer = false
       AND v.create_volunteer = true
       AND NOT EXISTS (
         SELECT 1 FROM op_volunteer_roles AS vr
         WHERE vr.shiftboard_id = v.shiftboard_id
           AND vr.role_id IN (?, ?)
           AND vr.remove_role = false
       )
     ORDER BY
       v.created_at IS NULL,
       v.created_at DESC,
       v.world_name COLLATE utf8mb4_general_ci`,
    [ROLE_PEERS_SQUADDIE_ID, ROLE_PEERS_SHIFT_LEAD_ID]
  );

  const header = ["Signed up", "Name", "Playa name", "Email"];
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [row.created_at, row.world_name, row.playa_name, row.email]
        .map(csvCell)
        .join(",")
    ),
  ];
  // Leading BOM so Excel opens the UTF-8 file with the right encoding.
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="peers-new-volunteers-mailing-list.csv"`
  );
  return res.status(200).send(csv);
};

export default withAuth(newVolunteersReport);
