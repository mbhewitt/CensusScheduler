"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { ShiftPositionsUpdate } from "src/app/shifts/positions/update/[positionId]/ShiftPositionsUpdate";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";
import { Loading } from "src/components/general/Loading";

interface IAuthGateProps {
  positionId: string;
}

export const AuthGate = ({ positionId }: IAuthGateProps) => {
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
  return (
    <>
      {isSuperAdmin ? (
        <ShiftPositionsUpdate positionId={positionId} />
      ) : (
        <Loading />
      )}
    </>
  );
};
