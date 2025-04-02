"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { SignIn } from "@/app/sign-in/SignIn";
import { Loading } from "@/components/general/Loading";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAuthenticated } from "@/utils/checkIsRoleExist";

export const SignInAuthGate = () => {
  // context
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
  const router = useRouter();

  // side effects
  // ------------------------------------------------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/volunteers/${shiftboardId}/account`);
    }
  }, [isAuthenticated, router, shiftboardId]);

  // render
  // ------------------------------------------------------------
  return <>{isAuthenticated ? <Loading /> : <SignIn />}</>;
};
