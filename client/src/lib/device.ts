import crypto from "crypto";

// Trusted-device cookie for tablet passcode sign-in. A device is "provisioned"
// once it holds a valid `census-device` cookie, set by /api/provision/claim
// after scanning a super-admin's QR. /api/sign-in refuses passcode unless this
// cookie is present, so only provisioned tablets — never participants on the
// same network — can passcode-login. See migration 015.
//
// The cookie is stateless (HMAC-signed), so no devices table: validity is
// self-contained. The signing key is DERIVED from SESSION_SECRET rather than a
// new env var — one less thing to configure per deploy. Trade-off: rotating
// SESSION_SECRET deprovisions every tablet (and logs everyone out); that's the
// intended "nuclear deprovision" and is rare.

const COOKIE_NAME = "census-device";
// 400 days — the max cookie lifetime Chrome honors. A tablet stays trusted
// until it's wiped or SESSION_SECRET rotates.
const DEVICE_DURATION_MS = 400 * 24 * 60 * 60 * 1000;

interface DevicePayload {
  deviceId: string;
  expires: number;
}

function getSecret(): string {
  const base = process.env.SESSION_SECRET;
  if (!base) {
    throw new Error(
      "SESSION_SECRET env var is not set. Device provisioning cannot proceed safely."
    );
  }
  // Derive a device-specific key so a leaked device cookie can't be replayed as
  // a session cookie (different domains of the same secret).
  return crypto
    .createHmac("sha256", base)
    .update("census-device-v1")
    .digest("base64url");
}

function sign(payload: DevicePayload): string {
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(b64)
    .digest("base64url");
  return `${b64}.${hmac}`;
}

function verify(value: string): DevicePayload | null {
  const [b64, hmac] = value.split(".");
  if (!b64 || !hmac) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(b64)
    .digest("base64url");

  const a = Buffer.from(hmac, "base64url");
  const b = Buffer.from(expected, "base64url");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: DevicePayload;
  try {
    payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.deviceId !== "string") return null;
  if (typeof payload.expires !== "number") return null;
  if (payload.expires < Date.now()) return null;

  return payload;
}

export function buildDeviceCookie(deviceId: string): string {
  const value = sign({ deviceId, expires: Date.now() + DEVICE_DURATION_MS });
  const maxAgeSeconds = Math.floor(DEVICE_DURATION_MS / 1000);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; Secure`;
}

export function buildClearDeviceCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

export function readDeviceFromCookies(
  cookies: Partial<Record<string, string>>
): DevicePayload | null {
  const value = cookies[COOKIE_NAME];
  if (!value) return null;
  return verify(value);
}

// True if the request carries a valid trusted-device cookie.
export function isProvisionedDevice(
  cookies: Partial<Record<string, string>>
): boolean {
  return readDeviceFromCookies(cookies) !== null;
}

export const DEVICE_COOKIE_NAME = COOKIE_NAME;
