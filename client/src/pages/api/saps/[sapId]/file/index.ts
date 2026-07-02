import { promises as fs } from "node:fs";
import path from "node:path";

import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";

const SAP_FILES_DIR = process.env.SAP_FILES_DIR ?? "/data/census/saps/";

// GET /api/saps/[sapId]/file — re-download an already-issued SAP. Pure read:
// serves bytes only when the SAP is already 'received', and never mutates state
// (the issue POST is the only thing that flips the lock). Safe to link to.
const file = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  const sapId = Number(req.query.sapId);
  if (!Number.isFinite(sapId)) {
    return res.status(400).json({ statusCode: 400, message: "Bad sapId" });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT filename, sap_date, status FROM op_saps WHERE sap_id=?`,
    [sapId],
  );
  const row = rows[0];
  if (!row || row.status !== "received") {
    return res
      .status(404)
      .json({ statusCode: 404, message: "SAP not available for download" });
  }

  let buf: Buffer;
  try {
    buf = await fs.readFile(path.join(SAP_FILES_DIR, row.filename));
  } catch {
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

export default withSuperAdmin(file);
