import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import formidable from "formidable";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";
import { splitSapPdf } from "lib/sapPdf";

// formidable streams the multipart body itself, so disable Next's JSON parser.
export const config = { api: { bodyParser: false } };

const SAP_FILES_DIR = process.env.SAP_FILES_DIR ?? "/data/census/saps/";
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // a year's batch is a few MB; generous.

// POST /api/saps/upload (multipart, field "file"): ingest a SAP batch PDF.
// Splits into per-pass pages, dedupes by ticket_id (re-uploading the same batch
// is a no-op), writes SAP_<date>_<hash>.pdf per pass, and inserts op_saps rows.
const uploadHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number },
) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const form = formidable({ maxFileSize: MAX_UPLOAD_BYTES, keepExtensions: true });
  let filepath: string | undefined;
  try {
    const [, files] = await form.parse(req);
    const uploaded = files.file?.[0];
    if (!uploaded) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "No `file` provided" });
    }
    filepath = uploaded.filepath;
    const buf = await fs.readFile(filepath);

    let split;
    try {
      split = await splitSapPdf(buf);
    } catch {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Could not read PDF" });
    }

    // Dedupe against already-stored ticket ids (idempotent re-upload).
    const ticketIds = split.pages.map((p) => p.ticketId);
    const existing = new Set<string>();
    if (ticketIds.length > 0) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ticket_id FROM op_saps WHERE ticket_id IN (?)`,
        [ticketIds],
      );
      for (const r of rows) existing.add(String(r.ticket_id));
    }

    await fs.mkdir(SAP_FILES_DIR, { recursive: true });

    let ingested = 0;
    const byDate: Record<string, number> = {};
    const seen = new Set<string>();
    for (const p of split.pages) {
      if (existing.has(p.ticketId) || seen.has(p.ticketId)) continue;
      seen.add(p.ticketId);

      const filename = `SAP_${p.sapDate}_${crypto.randomBytes(8).toString("hex")}.pdf`;
      await fs.writeFile(path.join(SAP_FILES_DIR, filename), Buffer.from(p.bytes));

      // Best-effort link to an op_dates row (only matches when the SAP's
      // calendar date is in the current event's date table).
      const [dateRows] = await pool.query<RowDataPacket[]>(
        "SELECT date_id FROM op_dates WHERE `date` = ? LIMIT 1",
        [p.sapDate],
      );
      const dateId = dateRows[0]?.date_id ?? null;

      await pool.execute<ResultSetHeader>(
        `INSERT INTO op_saps
           (filename, date_id, ticket_id, sap_date, burn_year, status, uploaded_by)
         VALUES (?, ?, ?, ?, ?, 'available', ?)`,
        [filename, dateId, p.ticketId, p.sapDate, p.burnYear, session.shiftboardId],
      );
      ingested += 1;
      byDate[p.sapDate] = (byDate[p.sapDate] ?? 0) + 1;
    }

    return res.status(200).json({
      statusCode: 200,
      ingested,
      duplicates: split.pages.length - ingested,
      quarantined: split.unparseable,
      byDate,
    });
  } catch (err) {
    const message =
      err instanceof Error && /maxFileSize/.test(err.message)
        ? "File too large"
        : "Upload failed";
    return res.status(400).json({ statusCode: 400, message });
  } finally {
    if (filepath) await fs.unlink(filepath).catch(() => {});
  }
};

export default withSuperAdmin(uploadHandler);
