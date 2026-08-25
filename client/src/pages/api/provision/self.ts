import crypto from "crypto";

import type { NextApiRequest, NextApiResponse } from "next";

import { buildClearDeviceCookie, buildDeviceCookie } from "@/lib/device";
import { withSuperAdmin } from "@/lib/withSuperAdmin";

// Provision / un-provision the CURRENT browser as a trusted tablet, for a
// super-admin who is on the device itself (no QR round-trip needed — their
// super-admin session IS the authorization).
//   POST   → set the census-device cookie on this browser (provision).
//   DELETE → clear it (un-provision / revoke trust from this browser).
// Same trusted-device cookie as the QR flow (lib/device.ts); gated to
// super-admins like /api/provision/token.
const selfProvision = async (
  req: NextApiRequest,
  res: NextApiResponse,
  _session: { shiftboardId: number }
) => {
  if (req.method === "POST") {
    const deviceId = crypto.randomBytes(16).toString("base64url");
    res.setHeader("Set-Cookie", buildDeviceCookie(deviceId));
    return res.status(200).json({ statusCode: 200, provisioned: true });
  }
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", buildClearDeviceCookie());
    return res.status(200).json({ statusCode: 200, provisioned: false });
  }
  return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
};

export default withSuperAdmin(selfProvision);
