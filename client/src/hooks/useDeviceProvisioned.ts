"use client";

import { useEffect, useState } from "react";

// Whether this device is a provisioned tablet (holds a valid peers-device
// cookie). The cookie is httpOnly so JS can't read it directly — we ask the
// server via /api/auth/device. Used by SignIn to decide whether to show the
// passcode form. Defaults to false until the one-shot check resolves, so a
// normal device never briefly exposes passcode.
export const useDeviceProvisioned = (): boolean => {
  const [provisioned, setProvisioned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/device", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProvisioned(Boolean(data?.provisioned));
      })
      .catch(() => {
        /* network error — treat as not provisioned (passcode stays hidden) */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return provisioned;
};
