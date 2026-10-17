import type { NextApiRequest, NextApiResponse } from "next";

import { buildScopedToken, readSessionFromCookies } from "@/lib/session";

// Dust "connect" hop (#798). Mirrors Dust's Volunteeripate integration: Dust
// opens {base}/?dust_redirect=https://dust.events/…; we make sure the
// volunteer is signed in (Okta), then send them back to dust_redirect with
// ?token=…, which Dust uses once against /api/dust/shift_data.json.
// ponytail: no consent screen — the volunteer started this from Dust's own
// "Remind me of volunteer shifts" button, same as Volunteeripate. Add one if
// a second partner app ever uses this.

const DUST_ORIGIN = "https://dust.events";
// Dust uses the token immediately and doesn't store it; each re-sync signs in
// again. Keep it short so a leaked URL is useless within minutes.
const DUST_TOKEN_TTL_MS = 15 * 60 * 1000;

const dustConnect = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }

  // Only ever redirect a token to Dust itself — never an arbitrary URL.
  let target: URL;
  try {
    target = new URL(String(req.query.dust_redirect));
  } catch {
    return res.status(400).send("Missing or invalid dust_redirect.");
  }
  if (target.origin !== DUST_ORIGIN) {
    return res.status(400).send("dust_redirect must be a dust.events link.");
  }

  const session = readSessionFromCookies(req.cookies);
  if (!session) {
    const back = `/api/dust?dust_redirect=${encodeURIComponent(target.href)}`;
    return res.redirect(`/api/auth/okta?returnTo=${encodeURIComponent(back)}`);
  }

  target.searchParams.set(
    "token",
    buildScopedToken("dust", session.shiftboardId, DUST_TOKEN_TTL_MS)
  );
  return res.redirect(target.href);
};

export default dustConnect;
