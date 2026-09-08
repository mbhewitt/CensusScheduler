"use client";

import dayjs, { Dayjs } from "dayjs";
import { useContext, useEffect, useState } from "react";

import { DeveloperModeContext } from "@/state/developer-mode/context";

// Effective "now" for time-window logic (esp. the shift check-in window).
//
// - Dev-mode clock override ON  → the spoofed value (for testing the window).
// - Otherwise → the LIVE current time, re-read every `intervalMs` so windows
//   open/close as real time passes WITHOUT a page reload.
//
// Why: DeveloperMode's `dateTime.value` is set once (formatDateTime()) at app
// load and only changes when the dev-mode clock UI dispatches. Reading it
// directly froze "now" at load, so the shift check-in boxes never appeared as
// the ±window arrived — a reload/re-login refreshed it, which is exactly the
// "log in and try again works" behavior reported (Chipper 2026-09-08). This
// hook keeps time live in normal operation while preserving the dev override.
export const useNow = (intervalMs = 30_000): Dayjs => {
  const {
    developerModeState: { dateTime },
  } = useContext(DeveloperModeContext);
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    if (dateTime.isEnabled) return; // spoofed clock: don't tick over it
    setNow(dayjs());
    const id = setInterval(() => setNow(dayjs()), intervalMs);
    return () => clearInterval(id);
  }, [dateTime.isEnabled, intervalMs]);

  return dateTime.isEnabled ? dayjs(dateTime.value) : now;
};
