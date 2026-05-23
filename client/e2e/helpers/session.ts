// Session-cookie helper for tests that need to call API endpoints behind
// withAuth. Signs a payload with the same HMAC secret the dev server is
// configured with via SESSION_SECRET in playwright.config.ts.
//
// Mirrors the logic in client/src/lib/session.ts — kept in sync by
// matching constant names and the {b64(json)}.{hmac} format. Do not import
// the real session module here; it pulls in Next.js types that don't load
// in the Node-only test runner.

import crypto from "crypto";

const SECRET =
  process.env.SESSION_SECRET ?? "e2e-test-session-secret-not-for-prod";
const COOKIE_NAME = "census-session";
const ONE_HOUR_MS = 60 * 60 * 1000;

export function buildSessionCookieValue(
  shiftboardId: number,
  expiresAt: number = Date.now() + ONE_HOUR_MS
): string {
  const payload = JSON.stringify({ shiftboardId, expires: expiresAt });
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(b64)
    .digest("base64url");
  return `${b64}.${hmac}`;
}

// Header string ready to pass as { Cookie: ... } to playwright request.
export function buildSessionCookieHeader(shiftboardId: number): string {
  return `${COOKIE_NAME}=${buildSessionCookieValue(shiftboardId)}`;
}
