import crypto from "crypto";

import type { ResultSetHeader } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { buildDeviceCookie } from "@/lib/device";
import { pool } from "lib/database";

// POST /api/provision/claim — PUBLIC (the tablet isn't logged in; the one-time
// token IS the credential). Consumes a provisioning token and sets the trusted
// `peers-device` cookie on this device. Allowlisted in middleware. See #012.
//
// Body: { token: string }.

const claim = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body ?? {});
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return res.status(400).json({ statusCode: 400, message: "Missing token" });
  }

  // Atomic consume: only succeeds if the token exists, is unexpired, and hasn't
  // been consumed. The conditional UPDATE closes the race where two devices
  // claim the same token — exactly one gets affectedRows === 1.
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE op_provision_tokens
        SET consumed_at = NOW()
      WHERE token = ?
        AND consumed_at IS NULL
        AND expires_at > NOW()`,
    [token]
  );

  if (result.affectedRows !== 1) {
    return res.status(410).json({
      statusCode: 410,
      message: "This provisioning code is invalid, already used, or expired.",
    });
  }

  const deviceId = crypto.randomBytes(16).toString("base64url");
  res.setHeader("Set-Cookie", buildDeviceCookie(deviceId));

  return res
    .status(200)
    .json({ statusCode: 200, message: "Device provisioned" });
};

export default claim;
