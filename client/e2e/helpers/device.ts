// Trusted-device cookie helper for tests that exercise the tablet passcode
// sign-in UI. The sign-in page only renders the volunteer/passcode form when
// the device is provisioned (SignIn.tsx: showPasscode = useDeviceProvisioned()
// === true), so specs that drive that form must first plant a valid
// `census-device` cookie or the form never appears and every interaction
// times out.
//
// Mirrors the sign()/getSecret() logic in client/src/lib/device.ts — kept in
// sync by matching the "census-device-v1" key derivation and the
// {b64(json)}.{hmac} format. Do not import the real module here; it pulls in
// Next types that don't load in the Node-only test runner.

import crypto from "crypto";

const SECRET_BASE =
  process.env.SESSION_SECRET ?? "e2e-test-session-secret-not-for-prod";
export const DEVICE_COOKIE_NAME = "census-device";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function deviceSecret(): string {
  return crypto
    .createHmac("sha256", SECRET_BASE)
    .update("census-device-v1")
    .digest("base64url");
}

export function buildDeviceCookieValue(
  deviceId = "e2e-tablet",
  expiresAt: number = Date.now() + ONE_DAY_MS
): string {
  const b64 = Buffer.from(
    JSON.stringify({ deviceId, expires: expiresAt }),
    "utf8"
  ).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", deviceSecret())
    .update(b64)
    .digest("base64url");
  return `${b64}.${hmac}`;
}

// Plant the trusted-device cookie on a Playwright browser context so the
// passcode sign-in form renders. Call in a beforeEach before any page.goto.
export async function provisionTabletDevice(context: {
  addCookies: (
    cookies: { name: string; value: string; url: string }[]
  ) => Promise<void>;
}): Promise<void> {
  await context.addCookies([
    {
      name: DEVICE_COOKIE_NAME,
      value: buildDeviceCookieValue(),
      url: "http://localhost:3000",
    },
  ]);
}
