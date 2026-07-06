"use client";

import { useContext, useEffect, useState } from "react";

import { Schedule } from "@/app/volunteers/[shiftboardId]/schedule/Schedule";
import { SessionContext } from "@/state/session/context";

// /shifts now renders the agenda (Schedule) instead of the old data-table
// (#470, Chipper 2026-07-06). The agenda needs the current volunteer's
// shiftboardId, which the schedule route gets from the URL; here we read it
// from the session instead. Signed out (shiftboardId 0, e.g. on-playa
// walk-ups) → Schedule shows the open-shift browse view only.
//
// The old table lives on in @/app/shifts/Shifts — kept intact so we can revert
// (point this page back at <Shifts />) or reuse it as the future table view.
export const ShiftsAgenda = () => {
  const {
    sessionState: {
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

  // shiftboardId comes from the session (sessionStorage — client only), so
  // rendering the agenda during SSR / the first client render would produce
  // different markup than the hydrated client and crash hydration in a
  // production build (what took down /shifts on 2026-07-06). Render nothing
  // until mounted so SSR + the first client render match, then render the
  // agenda client-side. (The /schedule route sidesteps this via AuthGate +
  // a URL param present on both server and client.)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return <Schedule shiftboardId={shiftboardId ?? 0} />;
};
