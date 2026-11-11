import crypto from "crypto";

import { withSuperAdmin } from "@/lib/withSuperAdmin";

// GET /api/planning-handoff — the super-admin "Planning" link. Sends the
// signed-in person to the Census planning app (a separate app) already signed
// in: a 60-second, single-use token `<base64url {sb, exp, nonce}>.<HMAC>` keyed
// with PLANNING_HANDOFF_SECRET, which the planning app shares. The planning app
// still checks its own list, so being a super admin here is not enough there.
export default withSuperAdmin(async (req, res, session) => {
  const base = process.env.PLANNING_APP_URL;
  const secret = process.env.PLANNING_HANDOFF_SECRET ?? "";
  if (!base || secret.length < 32) {
    res
      .status(503)
      .json({ statusCode: 503, message: "Planning link is not set up" });
    return;
  }
  const b64 = Buffer.from(
    JSON.stringify({
      sb: session.shiftboardId,
      exp: Date.now() + 60e3,
      nonce: crypto.randomBytes(16).toString("base64url"),
    })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("base64url");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.redirect(302, `${base}/api/handoff?t=${b64}.${sig}`);
});
