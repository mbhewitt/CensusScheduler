"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  // side effects
  // ------------------------------------------------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );

  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = searchParams?.get("returnTo");
      if (returnTo && returnTo.startsWith("/")) {
        router.push(returnTo);
      } else {
        router.push(`/volunteers/${shiftboardId}/info`);
      }
    }
  }, [isAuthenticated, router, searchParams, shiftboardId]);

  // render
  // ------------------------------------------------------------
  return <>{isAuthenticated ? <Loading /> : <SignIn />}</>;
};
