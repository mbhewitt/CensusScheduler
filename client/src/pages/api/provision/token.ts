import crypto from "crypto";

import type { NextApiRequest, NextApiResponse } from "next";

import { isSuperAdmin } from "@/lib/authz";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";

// POST /api/provision/token — super-admin only. Mint a single-use, short-TTL
// provisioning token for a tablet. The admin's browser renders it as a QR
// (`${origin}/provision#${token}`); the tablet scans it and calls
// /api/provision/claim to become a trusted device. See migration 012.
//
// peers uses withAuth (verifies the session cookie) + an in-route super-admin
// role check, mirroring the other admin endpoints (e.g. tablet-report) — there
// is no withSuperAdmin wrapper on this fork.

// Short window: a QR that isn't scanned promptly (or was photographed) is dead.
const TOKEN_TTL_MS = 10 * 60 * 1000;

const mintToken = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  // Super-admin only — provisioning a trusted device is a security-sensitive
  // action, so it's gated tighter than the "Shift Leads & up" reports.
  if (!(await isSuperAdmin(session.shiftboardId))) {
    return res.status(403).json({
      statusCode: 403,
      message: "Super-admin access is required to provision a tablet.",
    });
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await pool.query(
    `INSERT INTO op_provision_tokens (token, created_by, expires_at)
     VALUES (?, ?, ?)`,
    [token, session.shiftboardId, expiresAt]
  );

  return res.status(200).json({
    statusCode: 200,
    token,
    expiresAt: expiresAt.toISOString(),
    ttlMs: TOKEN_TTL_MS,
  });
};

export default withAuth(mintToken);
