import { isProvisionedDevice } from "@/lib/device";

// Effective on-playa for the SERVER, per request: true on an on-playa build, or
// when the request comes from a provisioned tablet (valid census-device
// cookie). Use in API routes to gate walk-up actions (check-in, adds) that
// on-playa allows without an admin login — a provisioned tablet is treated as
// on-playa. Mirrors the client useIsOnPlaya hook. Node runtime only (device
// verification uses node crypto), so do NOT import this into edge middleware.
export const isOnPlayaRequest = (
  cookies: Partial<Record<string, string>>
): boolean =>
  process.env.NEXT_PUBLIC_PIN_ENABLED !== "false" ||
  isProvisionedDevice(cookies);
