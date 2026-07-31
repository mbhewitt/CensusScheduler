import type { ResultSetHeader } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";

interface NotesBody {
  shiftboardId?: number;
  email?: string;
  notes?: string | null;
}

// POST /api/saps/notes — persist a super-admin's per-person note (exceptions,
// context). Stored on the person: op_volunteers.sap_notes for real volunteers,
// op_sap_offbook.notes for off-book entries. SAP page only.
const sapNotes = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const body: NotesBody =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});

  // Empty string is a valid "cleared" note; only null/undefined normalizes.
  const notes = body.notes == null ? null : String(body.notes);

  let result: ResultSetHeader;
  if (body.shiftboardId != null && !body.email) {
    [result] = await pool.execute<ResultSetHeader>(
      `UPDATE op_volunteers SET sap_notes=? WHERE shiftboard_id=?`,
      [notes, body.shiftboardId],
    );
  } else if (body.email && body.shiftboardId == null) {
    [result] = await pool.execute<ResultSetHeader>(
      `UPDATE op_sap_offbook SET notes=? WHERE email=?`,
      [notes, body.email.toLowerCase()],
    );
  } else {
    return res.status(400).json({
      statusCode: 400,
      message: "Provide exactly one of shiftboardId or email",
    });
  }

  if (result.affectedRows === 0) {
    return res.status(404).json({ statusCode: 404, message: "Person not found" });
  }
  return res.status(200).json({ statusCode: 200, notes });
};

export default withSuperAdmin(sapNotes);
