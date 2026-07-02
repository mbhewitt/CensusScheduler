import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";
import { getCurrentBurnYear } from "lib/sapDb";

// GET /api/saps — the full SAP pool for the current burn year with disposition,
// for the bottom listing on the super-admin page. Sorted by SAP date asc.
const sapsPool = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const burnYear = await getCurrentBurnYear();
  if (burnYear === null) {
    return res.status(200).json({ statusCode: 200, burnYear: null, saps: [] });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.sap_id, s.sap_date, s.status, s.ticket_id, s.received_via,
            s.received_at, s.shiftboard_id, s.assigned_email,
            s.superseded_by_sap_id,
            v.playa_name, v.world_name
       FROM op_saps s
       LEFT JOIN op_volunteers v ON s.shiftboard_id = v.shiftboard_id
      WHERE s.burn_year = ?
      ORDER BY s.sap_date ASC, s.sap_id ASC`,
    [burnYear],
  );

  const saps = rows.map((r) => {
    // "unassigned" reads clearer than the internal 'available' state.
    const disposition = r.status === "available" ? "unassigned" : r.status;
    const assignee = r.shiftboard_id
      ? r.playa_name || r.world_name || `#${r.shiftboard_id}`
      : (r.assigned_email ?? null);
    return {
      sapId: r.sap_id,
      sapDate: r.sap_date,
      ticketId: r.ticket_id,
      disposition,
      receivedVia: r.received_via,
      receivedAt: r.received_at,
      assignee,
      supersededBySapId: r.superseded_by_sap_id,
    };
  });

  return res.status(200).json({ statusCode: 200, burnYear, saps });
};

export default withSuperAdmin(sapsPool);
