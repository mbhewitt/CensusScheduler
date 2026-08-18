import type { ResultSetHeader } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";
import { buildPayload, type QrSettings, type QrType } from "lib/qr";
import { deriveListFields, mapQrRow, type QrRow } from "lib/qrDb";
import { getCurrentBurnYear } from "lib/sapDb";

const VALID_TYPES: QrType[] = ["calendar", "link", "wifi"];

// GET  /api/qr-codes         — the registry list.
// POST /api/qr-codes         — create a new QR (validates payload builds).
const qrCodes = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number },
) => {
  if (req.method === "GET") {
    const burnYear = await getCurrentBurnYear();
    const [rows] = await pool.query<QrRow[]>(
      `SELECT * FROM op_qr_codes ORDER BY created_at DESC, qr_id DESC`,
    );
    return res.status(200).json({
      statusCode: 200,
      burnYear,
      qrCodes: rows.map(mapQrRow),
    });
  }

  if (req.method === "POST") {
    let body: { qrType?: QrType; filename?: string; settings?: QrSettings };
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ statusCode: 400, message: "Bad JSON" });
    }
    const { qrType, filename, settings } = body;
    if (!qrType || !VALID_TYPES.includes(qrType)) {
      return res.status(400).json({ statusCode: 400, message: "Invalid qrType" });
    }
    if (!filename?.trim()) {
      return res.status(400).json({ statusCode: 400, message: "Filename is required" });
    }
    if (!settings) {
      return res.status(400).json({ statusCode: 400, message: "Missing settings" });
    }

    // Build the payload now so an invalid design is rejected before it's stored.
    let payload: string;
    try {
      payload = buildPayload(qrType, settings);
    } catch (err) {
      return res.status(400).json({
        statusCode: 400,
        message: err instanceof Error ? err.message : "Invalid QR settings",
      });
    }

    const derived = deriveListFields(qrType, settings);
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO op_qr_codes
           (qr_type, filename, subject, payload, settings, burn_year, event_date, event_time, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          qrType,
          filename.trim(),
          derived.subject,
          payload,
          JSON.stringify(settings),
          derived.burnYear,
          derived.eventDate,
          derived.eventTime,
          session.shiftboardId,
        ],
      );
      return res.status(201).json({ statusCode: 201, qrId: result.insertId });
    } catch (err) {
      // Unique filename collision -> friendly 409.
      if (err instanceof Error && /Duplicate entry/.test(err.message)) {
        return res
          .status(409)
          .json({ statusCode: 409, message: "That filename is already in use" });
      }
      throw err;
    }
  }

  return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
};

export default withSuperAdmin(qrCodes);
