"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { Account } from "src/app/volunteers/account/[shiftboardId]/Account";
import { Loading } from "src/components/general/Loading";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAuthenticated } from "src/utils/checkIsRoleExist";

interface IAuthGateProps {
  shiftboardId: string;
}

export const AuthGate = ({ shiftboardId }: IAuthGateProps) => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
    },
  } = useContext(SessionContext);

  // other hooks
  // --------------------
  const router = useRouter();

  // logic
  // --------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );

  // side effects
  // --------------------
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, router]);

  // render
  // --------------------
  return (
    <>
      {isAuthenticated ? <Account shiftboardId={shiftboardId} /> : <Loading />}
    </>
  );
};
