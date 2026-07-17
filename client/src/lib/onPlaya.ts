// Playa-network detection. Pure JS (no Node APIs) so it is safe to import from
// BOTH the Edge middleware and Node API routes.
//
// Passcode ("PIN") sign-in is only offered/honored when the request comes from
// the on-playa gateway network. We key off nginx's `X-Real-IP` header, which is
// set to $remote_addr (the true client IP) and cannot be spoofed by the client
// — prod has no CDN in front, so this is the real client. The default CIDR is
// the brcwork gateway range (per Mew 2026-07-17); override via env if it moves.

const DEFAULT_CIDR = "162.212.150.0/23";

export function getPlayaCidr(): string {
  return process.env.PEERS_ONPLAYA_CIDR || DEFAULT_CIDR;
}

function ipv4ToInt(ip: string): number | null {
  // Strip an IPv6-mapped IPv4 prefix (e.g. "::ffff:162.212.150.5").
  const cleaned = ip.replace(/^::ffff:/i, "").trim();
  const parts = cleaned.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    const v = Number(part);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt === null || rangeInt === null || !Number.isInteger(bits)) {
    return false;
  }
  if (bits <= 0) return true;
  if (bits > 32) return false;
  const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

type HeaderGetter = (name: string) => string | null | undefined;

// The trusted client IP: X-Real-IP (nginx = $remote_addr) first, then the last
// hop of X-Forwarded-For (also nginx-appended) as a fallback.
export function getClientIp(get: HeaderGetter): string | null {
  const realIp = get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = get("x-forwarded-for");
  if (xff) {
    const hops = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return null;
}

export function isOnPlaya(get: HeaderGetter): boolean {
  const ip = getClientIp(get);
  if (!ip) return false;
  return isIpInCidr(ip, getPlayaCidr());
}

// Non-httpOnly cookie the middleware sets so client components can read the
// on-playa decision at runtime (drives whether the passcode UI is shown).
export const ON_PLAYA_COOKIE = "peers-on-playa";
