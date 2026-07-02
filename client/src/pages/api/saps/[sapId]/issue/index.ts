import { promises as fs } from "node:fs";
import path from "node:path";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";

const SAP_FILES_DIR = process.env.SAP_FILES_DIR ?? "/data/census/saps/";

// POST /api/saps/[sapId]/issue — deliver a SAP by download. This is a POST (not
// a GET link) on purpose: it atomically flips assigned -> received and LOCKS the
// SAP against reassignment, and a plain GET would be tripped by browser/AV/link
// prefetch. The response body IS the PDF, so the lock and the bytes are handed
// over in one round-trip with nothing to pre-fetch.
const issue = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  const sapId = Number(req.query.sapId);
  if (!Number.isFinite(sapId)) {
    return res.status(400).json({ statusCode: 400, message: "Bad sapId" });
  }

  // Atomic guard: only an 'assigned' SAP becomes 'received'. 0 rows means it was
  // already issued (or isn't assigned) — a race or double-click.
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE op_saps
        SET status='received', received_at=NOW(), received_via='download'
      WHERE sap_id=? AND status='assigned'`,
    [sapId],
  );
  if (result.affectedRows === 0) {
    return res.status(409).json({
      statusCode: 409,
      message: "SAP is not assigned (already issued or unassigned)",
    });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT filename, sap_date FROM op_saps WHERE sap_id=?`,
    [sapId],
  );
  const row = rows[0];
  let buf: Buffer;
  try {
    buf = await fs.readFile(path.join(SAP_FILES_DIR, row.filename));
  } catch {
    // The row is now 'received' but the file is missing — surface it loudly
    // rather than serving an empty PDF.
    return res
      .status(500)
      .json({ statusCode: 500, message: "SAP file not found on disk" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="SAP_${row.sap_date}.pdf"`,
  );
  return res.send(buf);
};

export default withSuperAdmin(issue);
