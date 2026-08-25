import crypto from "crypto";

import type { NextApiRequest, NextApiResponse } from "next";

import { isSuperAdmin } from "@/lib/authz";
import { buildDeviceCookie } from "@/lib/device";
import { withAuth } from "@/lib/withAuth";

// POST /api/provision/self — super-admin only. Provision THE CURRENT browser as
// a trusted device without a QR/camera. A super-admin signed in on the machine
// (e.g. the HQ desktop with no camera) clicks "Provision this device" and this
// sets the signed peers-device cookie directly on the response. No token-table
// round trip is needed: the caller is already an authenticated super-admin, so
// their session IS the authorization. The QR flow (token + /claim) still exists
// for real tablets, where the super-admin provisions from a separate phone.

const provisionSelf = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  if (!(await isSuperAdmin(session.shiftboardId))) {
    return res.status(403).json({
      statusCode: 403,
      message: "Super-admin access is required to provision a device.",
    });
  }

  const deviceId = crypto.randomBytes(16).toString("base64url");
  res.setHeader("Set-Cookie", buildDeviceCookie(deviceId));

  return res
    .status(200)
    .json({ statusCode: 200, message: "This device is provisioned" });
};

export default withAuth(provisionSelf);
