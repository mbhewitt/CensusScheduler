"use client";

import { useEffect, useState } from "react";

// Whether this device is a provisioned tablet (holds a valid census-device
// cookie). The cookie is httpOnly so JS can't read it directly — we ask the
// server via /api/auth/device. Used by SignIn (show the passcode form, hide
// Okta) and the header (pick the short tablet idle timeout). Returns `undefined`
// while the one-shot check is in flight so callers can hold off rendering
// auth options (no Okta flash on a tablet); resolves to false on error so a
// normal device never briefly exposes passcode.
export const useDeviceProvisioned = (): boolean | undefined => {
  const [provisioned, setProvisioned] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/device", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProvisioned(Boolean(data?.provisioned));
      })
      .catch(() => {
        // network error — treat as not provisioned (passcode stays hidden)
        if (!cancelled) setProvisioned(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return provisioned;
};
