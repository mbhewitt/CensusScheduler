"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { SignIn } from "src/app/sign-in/SignIn";
import { Loading } from "src/components/general/Loading";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAuthenticated } from "src/utils/checkIsRoleExist";

export const SignInAuthGate = () => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

  // other hooks
  // --------------------
  const router = useRouter();

  // side effects
  // --------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/volunteers/account/${shiftboardId}`);
    }
  }, [isAuthenticated, router, shiftboardId]);

  // render
  // --------------------
  return <>{isAuthenticated ? <Loading /> : <SignIn />}</>;
};
