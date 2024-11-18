"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { ShiftPositionsUpdate } from "src/app/shifts/positions/update/[positionId]/ShiftPositionsUpdate";
import { Loading } from "src/components/general/Loading";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

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
  }, [isSuperAdmin, router]);

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
