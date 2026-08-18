import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";
import { buildPayload, type QrSettings, type QrType } from "lib/qr";
import { deriveListFields, getQrById } from "lib/qrDb";

// PUT    /api/qr-codes/[qrId] — save edits (re-decoded uploads round-trip here too).
// DELETE /api/qr-codes/[qrId] — remove from the registry.
const qrCode = async (req: NextApiRequest, res: NextApiResponse) => {
  const qrId = Number(req.query.qrId);
  if (!Number.isFinite(qrId)) {
    return res.status(400).json({ statusCode: 400, message: "Bad qrId" });
  }

  if (req.method === "DELETE") {
    await pool.execute(`DELETE FROM op_qr_codes WHERE qr_id = ?`, [qrId]);
    return res.status(200).json({ statusCode: 200 });
  }

  if (req.method === "PUT") {
    const existing = await getQrById(qrId);
    if (!existing) {
      return res.status(404).json({ statusCode: 404, message: "Not found" });
    }
    let body: { qrType?: QrType; filename?: string; settings?: QrSettings };
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ statusCode: 400, message: "Bad JSON" });
    }
    const qrType = body.qrType ?? existing.qrType;
    const filename = (body.filename ?? existing.filename).trim();
    const settings = body.settings ?? existing.settings;
    if (!filename) {
      return res.status(400).json({ statusCode: 400, message: "Filename is required" });
    }

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
      await pool.execute(
        `UPDATE op_qr_codes
            SET qr_type = ?, filename = ?, subject = ?, payload = ?, settings = ?,
                burn_year = ?, event_date = ?, event_time = ?
          WHERE qr_id = ?`,
        [
          qrType,
          filename,
          derived.subject,
          payload,
          JSON.stringify(settings),
          derived.burnYear,
          derived.eventDate,
          derived.eventTime,
          qrId,
        ],
      );
      return res.status(200).json({ statusCode: 200 });
    } catch (err) {
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

export default withSuperAdmin(qrCode);
