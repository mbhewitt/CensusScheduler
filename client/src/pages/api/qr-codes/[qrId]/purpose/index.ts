import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { pool } from "lib/database";

const VALID_PURPOSES = ["home", "download"];

// POST /api/qr-codes/[qrId]/purpose  body { purpose: "home"|"download"|null }
// Designate this QR for a purpose. Only ONE QR may hold each purpose at a time,
// so we clear the prior holder before tagging this one (two statements; a txn
// would be tidier but the window is a single super-admin click).
const purpose = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  const qrId = Number(req.query.qrId);
  if (!Number.isFinite(qrId)) {
    return res.status(400).json({ statusCode: 400, message: "Bad qrId" });
  }
  let body: { purpose?: string | null };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ statusCode: 400, message: "Bad JSON" });
  }
  const p = body.purpose ?? null;
  if (p !== null && !VALID_PURPOSES.includes(p)) {
    return res.status(400).json({ statusCode: 400, message: "Invalid purpose" });
  }

  if (p === null) {
    // Untag just this row.
    await pool.execute(`UPDATE op_qr_codes SET purpose = NULL WHERE qr_id = ?`, [qrId]);
    return res.status(200).json({ statusCode: 200 });
  }

  // ponytail: clear-then-set, not a transaction. Worst case (a crash between the
  // two statements) leaves the purpose unassigned, never double-assigned — the
  // safe direction. Wrap in a txn only if that transient gap ever matters.
  await pool.execute(`UPDATE op_qr_codes SET purpose = NULL WHERE purpose = ?`, [p]);
  await pool.execute(`UPDATE op_qr_codes SET purpose = ? WHERE qr_id = ?`, [p, qrId]);
  return res.status(200).json({ statusCode: 200 });
};

export default withSuperAdmin(purpose);
