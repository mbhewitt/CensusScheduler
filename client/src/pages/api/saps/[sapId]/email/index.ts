import { promises as fs } from "node:fs";
import path from "node:path";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";
import { enqueueEmail } from "lib/mail";

const SAP_FILES_DIR = process.env.SAP_FILES_DIR ?? "/data/census/saps/";

// POST /api/saps/[sapId]/email — deliver a SAP by email. First delivery
// atomically flips assigned -> received and LOCKS the SAP; an already-received
// SAP can be re-sent to the same person without changing state. The PDF rides
// as an attachment. SAP delivery is transactional (an access credential), so it
// intentionally bypasses the marketing unsubscribe filter.
const emailSap = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  const sapId = Number(req.query.sapId);
  if (!Number.isFinite(sapId)) {
    return res.status(400).json({ statusCode: 400, message: "Bad sapId" });
  }

  // Resolve recipient + validate BEFORE locking, so we never mark a SAP
  // received that we couldn't actually send.
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.filename, s.sap_date, s.status, s.assigned_email, v.email AS vol_email
       FROM op_saps s
       LEFT JOIN op_volunteers v ON s.shiftboard_id = v.shiftboard_id
      WHERE s.sap_id = ?`,
    [sapId],
  );
  const row = rows[0];
  if (!row) {
    return res.status(404).json({ statusCode: 404, message: "SAP not found" });
  }
  if (row.status !== "assigned" && row.status !== "received") {
    return res.status(409).json({
      statusCode: 409,
      message: "SAP is not assigned (unassigned or burned)",
    });
  }
  const to = row.assigned_email || row.vol_email;
  if (!to) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "No email on file for this person" });
  }

  let content: Buffer;
  try {
    content = await fs.readFile(path.join(SAP_FILES_DIR, row.filename));
  } catch {
    return res
      .status(500)
      .json({ statusCode: 500, message: "SAP file not found on disk" });
  }

  // First delivery locks (atomic; loses the race -> 409). A resend of an
  // already-received SAP skips this and just re-sends the same file.
  if (row.status === "assigned") {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE op_saps
          SET status='received', received_at=NOW(), received_via='email'
        WHERE sap_id=? AND status='assigned'`,
      [sapId],
    );
    if (result.affectedRows === 0) {
      return res
        .status(409)
        .json({ statusCode: 409, message: "SAP was just issued elsewhere" });
    }
  }

  const { id } = await enqueueEmail({
    to,
    subject: "Your Burning Man Setup Access Pass (SAP)",
    bodyText:
      `Your Setup Access Pass is attached.\n\n` +
      `It is valid on or after ${row.sap_date}. Print it and present it ` +
      `together with your ticket or credential at the gate.\n\n` +
      `A SAP is not a ticket and does not grant access on its own.`,
    attachment: { filename: `SAP_${row.sap_date}.pdf`, content },
    category: "sap",
  });

  return res.status(200).json({ statusCode: 200, queued: true, emailId: id });
};

export default withSuperAdmin(emailSap);
