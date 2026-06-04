// Generate a 4-digit passcode used for on-playa tablet sign-in.
// Returns a 4-character string with leading zeros preserved (e.g. "0042").
//
// Uses crypto.randomInt when available (Node runtime — API routes) so the
// digits aren't predictable from Math.random's seeded PRNG.
import { randomInt } from "crypto";

export const generatePasscode = (): string => {
  const n = randomInt(0, 10_000);
  return String(n).padStart(4, "0");
};
