"use client";

import { useContext } from "react";

import { Schedule } from "@/app/volunteers/[shiftboardId]/schedule/Schedule";
import { SessionContext } from "@/state/session/context";

// ponytail: the agenda IS the Shifts page now (the "My Shifts" flip). Schedule
// was already built to handle both a signed-out walk-up (shiftboardId 0 →
// browse-only) and a signed-in volunteer (personal shifts + eligibility), so
// /shifts just feeds it the session id. Revert = repoint page.tsx back to the
// old <Shifts> table, which is intentionally kept one import away.
export const ShiftsAgenda = () => {
  const {
    sessionState: {
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

  return <Schedule shiftboardId={shiftboardId} />;
};
