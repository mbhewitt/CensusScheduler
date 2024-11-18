"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { Loading } from "src/components/general/Loading";

import { ShiftPositions } from "src/app/shifts/positions/ShiftPositions";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

export const AuthGate = () => {
  // context
  // --------------------
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // other hooks
  // --------------------
  const router = useRouter();

  // logic
  // --------------------
  const isSuperAdmin = checkIsSuperAdmin(roleList);

  // side effects
  // --------------------
  useEffect(() => {
    if (!isSuperAdmin) {
      router.push("/sign-in");
    }
  }, [router]);

  // render
  // --------------------
  return <>{isSuperAdmin ? <ShiftPositions /> : <Loading />}</>;
};
