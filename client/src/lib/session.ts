import crypto from "crypto";

const COOKIE_NAME = "census-session";
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

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

export function buildSessionCookie(shiftboardId: number): string {
  const value = sign({
    shiftboardId,
    expires: Date.now() + SESSION_DURATION_MS,
  });
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
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
