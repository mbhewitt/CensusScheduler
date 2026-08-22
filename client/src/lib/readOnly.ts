// Read-only (maintenance) mode. Flipped at RUNTIME via env — a container
// restart, no rebuild — so we can freeze the cloud site at cutover without a
// deploy. NOT a NEXT_PUBLIC_* var (those are build-time inlined); read
// server-side in middleware and /api/read-only.
//
// When on: all mutating /api/* requests are blocked with 423 (see middleware),
// EXCEPT the auth writes needed to sign in and view. People can log in and read;
// they just can't change anything. See ONPLAYA_CUTOVER.md.

const DEFAULT_MESSAGE =
  "Census is in read-only mode right now — you can sign in and view your " +
  "schedule, but changes are paused.";

export function isReadOnly(): boolean {
  return process.env.CENSUS_READ_ONLY === "true";
}

export function readOnlyMessage(): string {
  return process.env.CENSUS_READ_ONLY_MESSAGE || DEFAULT_MESSAGE;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Auth writes that must keep working in read-only so people can still sign in
// and admins can still provision tablets. Everything else mutating is frozen.
const ALLOWED_WRITES = [
  "/api/sign-in",
  "/api/auth/sign-out",
  "/api/provision/claim",
];

// True for a request that read-only mode should block: a mutating method to a
// data endpoint that isn't one of the permitted auth writes.
export function isBlockedWrite(
  method: string | undefined,
  pathname: string
): boolean {
  if (!method || !MUTATING_METHODS.has(method.toUpperCase())) return false;
  if (!pathname.startsWith("/api/")) return false;
  return !ALLOWED_WRITES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}
