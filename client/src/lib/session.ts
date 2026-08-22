import crypto from "crypto";

const COOKIE_NAME = "census-session";
// Session lifetime differs by deployment (per Mew 2026-07-02):
//   - On-playa lab tablets are SHARED — keep the window short so a set-down
//     tablet doesn't leave someone logged in as another volunteer/admin.
//   - Off-playa (Okta-only, NEXT_PUBLIC_PIN_ENABLED="false") volunteers sign
//     up from their own devices at home, so a 1-hour window just logs them
//     out mid-flow. Give them a full day.
// NEXT_PUBLIC_* is inlined at build time, so this is a per-build decision.
const SESSION_DURATION_MS =
  process.env.NEXT_PUBLIC_PIN_ENABLED === "false"
    ? 24 * 60 * 60 * 1000 // 24 hours off-playa (web)
    : 60 * 60 * 1000; // 1 hour on-playa (shared tablets)

// "Stay signed in until I log out" for installed PWAs (per Mew 2026-08-21).
// A volunteer who installs the app on their own phone and signs in via Okta
// gets a long-lived session so they aren't logged out mid-event. Passcode
// sign-in NEVER gets this (shared tablets) — only the Okta path passes
// persistent=true. 400 days is the max cookie lifetime Chrome will honor.
const PERSISTENT_SESSION_DURATION_MS = 400 * 24 * 60 * 60 * 1000;

// Passcode sign-in is for SHARED tablets — a set-down tablet must not stay
// logged in as the previous person for long. 5 minutes (per Mew 2026-08-21,
// replacing the old 1h). Keyed to the login METHOD, not the build flag: passcode
// and Okta now coexist on the single volunteers.census origin, so the timeout
// must follow how you signed in, not which build served the page.
const PASSCODE_SESSION_DURATION_MS = 5 * 60 * 1000;

interface SessionPayload {
  shiftboardId: number;
  expires: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET env var is not set. Sign-in cannot proceed safely."
    );
  }
  return secret;
}

function sign(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(b64)
    .digest("base64url");
  return `${b64}.${hmac}`;
}

function verify(value: string): SessionPayload | null {
  const [b64, hmac] = value.split(".");
  if (!b64 || !hmac) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(b64)
    .digest("base64url");

  const a = Buffer.from(hmac, "base64url");
  const b = Buffer.from(expected, "base64url");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.shiftboardId !== "number") return null;
  if (typeof payload.expires !== "number") return null;
  if (payload.expires < Date.now()) return null;

  return payload;
}

export function buildSessionCookie(
  shiftboardId: number,
  opts: { persistent?: boolean; passcode?: boolean } = {}
): string {
  const { persistent = false, passcode = false } = opts;
  // Precedence: a persistent PWA login wins; passcode is the short shared-tablet
  // window; everything else uses the per-build default.
  const durationMs = persistent
    ? PERSISTENT_SESSION_DURATION_MS
    : passcode
      ? PASSCODE_SESSION_DURATION_MS
      : SESSION_DURATION_MS;
  const value = sign({
    shiftboardId,
    expires: Date.now() + durationMs,
  });
  const maxAgeSeconds = Math.floor(durationMs / 1000);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; Secure`;
}

export function buildClearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

export function readSessionFromHeader(
  cookieHeader: string | undefined
): SessionPayload | null {
  if (!cookieHeader) return null;
  for (const raw of cookieHeader.split(";")) {
    const [name, ...rest] = raw.trim().split("=");
    if (name === COOKIE_NAME) {
      return verify(rest.join("="));
    }
  }
  return null;
}

export function readSessionFromCookies(
  cookies: Partial<Record<string, string>>
): SessionPayload | null {
  const value = cookies[COOKIE_NAME];
  if (!value) return null;
  return verify(value);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
