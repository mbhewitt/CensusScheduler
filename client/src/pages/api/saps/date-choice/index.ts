import type { ResultSetHeader } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";

interface DateChoiceBody {
  shiftboardId?: number;
  email?: string;
  date?: string | null; // "YYYY-MM-DD" to pin, null/undefined to revert to Auto
}

// POST /api/saps/date-choice — persist the SAP-date dropdown choice so it
// survives between sessions (it used to live only in client state). Stored on
// the person, not a SAP: no pass is reserved until Assign.
const dateChoice = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const body: DateChoiceBody =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});

  const date = body.date ?? null;
  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "date must be YYYY-MM-DD or null" });
  }

  let result: ResultSetHeader;
  if (body.shiftboardId != null && !body.email) {
    [result] = await pool.execute<ResultSetHeader>(
      `UPDATE op_volunteers SET sap_date_override=? WHERE shiftboard_id=?`,
      [date, body.shiftboardId],
    );
  } else if (body.email && body.shiftboardId == null) {
    [result] = await pool.execute<ResultSetHeader>(
      `UPDATE op_sap_offbook SET sap_date_override=? WHERE email=?`,
      [date, body.email.toLowerCase()],
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
  return res.status(200).json({ statusCode: 200, date });
};

export default withSuperAdmin(dateChoice);
