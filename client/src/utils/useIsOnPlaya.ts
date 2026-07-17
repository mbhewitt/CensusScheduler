"use client";

import { useEffect, useState } from "react";

import { ON_PLAYA_COOKIE } from "@/lib/onPlaya";

// Reads the middleware-set on-playa cookie at runtime. SSR / first paint is
// false (off-playa → Okta-only); after mount it flips true if the request came
// from the on-playa gateway network, revealing the passcode option. This is a
// UI hint only — the server independently re-checks the client IP before
// honoring a passcode (see pages/api/sign-in).
export function useIsOnPlaya(): boolean {
  const [onPlaya, setOnPlaya] = useState(false);

  useEffect(() => {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${ON_PLAYA_COOKIE}=`));
    setOnPlaya(match?.split("=")[1] === "1");
  }, []);

  return onPlaya;
}
