// Acting-as Bearer tokens for the pumpkin ops bot (C-863, DESIGN §3.2 A1).
//
// The pumpkin-gate daemon on the prod host mints a short-lived token that says
// "this one request is made by volunteer N". The app turns it into that
// volunteer's normal session, so every role/admin check runs unchanged.
//
// Wire format:
//   Authorization: Bearer pk1.<b64url(json)>.<b64url(hmac)>
//   hmac = HMAC-SHA256(PUMPKIN_SECRET, "pk1.<b64url(json)>")
//   json = { shiftboardId, method, path, bodySha256, exp, nonce }
//     path       request target as sent: path + query, percent-encoded
//     bodySha256 hex sha256 of the raw body string ("" for GET / no body).
//                Send the body the way the browser does (a JSON string,
//                text/plain) — handlers JSON.parse(req.body) themselves.
//     exp        ms epoch, at most TOKEN_MAX_TTL_MS ahead
//     nonce      16–64 chars, single use
//
// Web Crypto only (no node "crypto") so the Edge middleware can import it.
// The middleware checks signature + exp; the Node layer (session.ts) checks
// method, path, body hash and burns the nonce.

export const TOKEN_PREFIX = "pk1.";
export const TOKEN_MAX_TTL_MS = 60 * 1000;

export interface ActingAsPayload {
  shiftboardId: number;
  method: string;
  path: string;
  bodySha256: string;
  exp: number;
  nonce: string;
}

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function sha256Hex(s: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

// The bearer string from an Authorization header, if it is a pumpkin token.
// Other Bearer values (e.g. CRON_SECRET on /api/cron) are not ours → null.
export function extractActingAsToken(
  authorization: string | null | undefined
): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(pk1\.\S+)$/.exec(authorization.trim());
  return m ? m[1] : null;
}

export function isCronPath(path: string): boolean {
  return path === "/api/cron" || path.startsWith("/api/cron/");
}

// Signature + shape + expiry. Returns the payload or null. No secret → null
// (a missing PUMPKIN_SECRET refuses every token; never falls back).
export async function verifyActingAsToken(
  token: string,
  secret: string | undefined,
  now = Date.now()
): Promise<ActingAsPayload | null> {
  if (!secret || !token.startsWith(TOKEN_PREFIX)) return null;
  const parts = token.slice(TOKEN_PREFIX.length).split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const sigBytes = b64urlToBytes(sig);
  if (!b64 || !sigBytes) return null;

  const ok = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret, "verify"),
    sigBytes,
    enc.encode(TOKEN_PREFIX + b64)
  );
  if (!ok) return null;

  let p: ActingAsPayload;
  try {
    const bytes = b64urlToBytes(b64);
    if (!bytes) return null;
    p = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (
    !p ||
    !Number.isInteger(p.shiftboardId) ||
    p.shiftboardId <= 0 ||
    typeof p.method !== "string" ||
    typeof p.path !== "string" ||
    typeof p.bodySha256 !== "string" ||
    !/^[0-9a-f]{64}$/.test(p.bodySha256) ||
    typeof p.nonce !== "string" ||
    p.nonce.length < 16 ||
    p.nonce.length > 64 ||
    typeof p.exp !== "number"
  ) {
    return null;
  }
  if (p.exp <= now || p.exp > now + TOKEN_MAX_TTL_MS) return null;
  return p;
}

// Mint a token. The app never calls this in production (the gate mints); it
// exists so the tests and any local tooling use the exact same format.
export async function mintActingAsToken(
  payload: ActingAsPayload,
  secret: string
): Promise<string> {
  const b64 = bytesToB64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      await hmacKey(secret, "sign"),
      enc.encode(TOKEN_PREFIX + b64)
    )
  );
  return `${TOKEN_PREFIX}${b64}.${bytesToB64url(sig)}`;
}

// Single-use nonces. In-process (one census-app container). A restart forgets
// them, which reopens at most a TOKEN_MAX_TTL_MS replay window — accepted in
// the design. ponytail: process-local Map, move to the DB if the app ever
// runs more than one container.
const seenNonces = new Map<string, number>();
const MAX_NONCES = 10_000;

export function consumeNonce(nonce: string, exp: number, now = Date.now()) {
  if (seenNonces.has(nonce)) return false;
  if (seenNonces.size >= MAX_NONCES) {
    for (const [n, e] of seenNonces) if (e <= now) seenNonces.delete(n);
    if (seenNonces.size >= MAX_NONCES) return false; // fail closed
  }
  seenNonces.set(nonce, exp);
  return true;
}
