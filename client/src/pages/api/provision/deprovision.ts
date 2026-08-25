import type { NextApiRequest, NextApiResponse } from "next";

import { isSuperAdmin } from "@/lib/authz";
import { buildClearDeviceCookie } from "@/lib/device";
import { withAuth } from "@/lib/withAuth";

// POST /api/provision/deprovision — super-admin only. Clears the peers-device
// cookie on THE CURRENT browser, so this device can no longer use passcode
// sign-in. A super-admin signed in on the machine clicks "Deprovision this
// device". This is per-device (the browser making the request); to wipe ALL
// devices at once, rotate SESSION_SECRET instead.

const deprovision = async (
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
      message: "Super-admin access is required to deprovision a device.",
    });
  }

  res.setHeader("Set-Cookie", buildClearDeviceCookie());

  return res
    .status(200)
    .json({ statusCode: 200, message: "This device is deprovisioned" });
};

export default withAuth(deprovision);
