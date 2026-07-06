"use client";

import { useContext } from "react";

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

  return <Schedule shiftboardId={shiftboardId ?? 0} />;
};
