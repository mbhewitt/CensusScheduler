"use client";

import { useEffect, useState } from "react";

// Whether this device is a provisioned tablet (holds a valid census-device
// cookie). The cookie is httpOnly so JS can't read it — we ask the server via
// /api/auth/device. Used by SignIn (show passcode, hide Okta), the header (short
// tablet idle timeout), and useIsOnPlaya (walk-up check-in sliders, etc.).
//
// Resilience (2026-09-01): this drives on-playa affordances like the shift
// check-in sliders, so a transient failure of the one-shot fetch must NOT hide
// them mid-shift. A provisioned tablet stays provisioned for the session, so we
// (a) cache a known-true result in sessionStorage and seed from it on mount —
// "sticky", and (b) retry a failed fetch a few times and never downgrade a
// cached true to false on a network blip. Returns `undefined` until the first
// resolution so callers can hold rendering (no passcode/Okta flash).
const CACHE_KEY = "census-device-provisioned";

const readCache = (): boolean | undefined => {
  try {
    const v = sessionStorage.getItem(CACHE_KEY);
    return v === null ? undefined : v === "true";
  } catch {
    return undefined;
  }
};
const writeCache = (v: boolean) => {
  try {
    sessionStorage.setItem(CACHE_KEY, String(v));
  } catch {
    /* private mode / storage disabled — fine, just not sticky */
  }
};

export const useDeviceProvisioned = (): boolean | undefined => {
  // Start undefined for SSR-safe hydration; seed from cache inside the effect.
  const [provisioned, setProvisioned] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const cached = readCache();
    if (cached !== undefined) setProvisioned(cached);

    const check = () => {
      fetch("/api/auth/device", { credentials: "same-origin" })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          const val = Boolean(data?.provisioned);
          setProvisioned(val);
          writeCache(val);
        })
        .catch(() => {
          if (cancelled) return;
          // Transient failure: retry with backoff. Never flip a known-true
          // tablet to false on a blip — keep whatever we've got.
          if (++attempts < 3) {
            setTimeout(check, 700 * attempts);
            return;
          }
          if (readCache() !== true) {
            setProvisioned((prev) => (prev === undefined ? false : prev));
          }
        });
    };
    check();

    return () => {
      cancelled = true;
    };
  }, []);

  return provisioned;
};
