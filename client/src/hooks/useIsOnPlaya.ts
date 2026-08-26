"use client";

import { useDeviceProvisioned } from "@/hooks/useDeviceProvisioned";

// Effective on-playa for the CLIENT: true on an on-playa build, or when this
// browser is a provisioned tablet — so a cloud/prod tablet gets the full
// on-playa experience (check-in, walk-up adds, shifts, on-playa copy). Returns
// `undefined` while the device check is in flight (build flag off only), so
// callers can hold off rendering on-playa-only affordances until it resolves.
// Server routes gate the same actions with isOnPlayaRequest (lib/onPlaya).
export const useIsOnPlaya = (): boolean | undefined => {
  const isProvisionedTablet = useDeviceProvisioned();
  if (process.env.NEXT_PUBLIC_PIN_ENABLED !== "false") return true;
  return isProvisionedTablet;
};
