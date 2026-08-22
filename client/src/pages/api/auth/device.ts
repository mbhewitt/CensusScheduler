import type { NextApiRequest, NextApiResponse } from "next";

import { isProvisionedDevice } from "@/lib/device";

// GET /api/auth/device — PUBLIC. Reports whether this device carries a valid
// trusted-device cookie. The cookie is httpOnly (JS can't read it), so the UI
// asks the server: SignIn uses this to decide whether to show the passcode
// form, and the header uses it to pick the short (tablet) idle timeout.
// This is advisory for the UI only — the real gate is server-side in
// /api/sign-in. Allowlisted in middleware.
const deviceStatus = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  return res.status(200).json({
    statusCode: 200,
    provisioned: isProvisionedDevice(req.cookies),
  });
};

export default deviceStatus;
