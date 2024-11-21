"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { Loading } from "src/components/general/Loading";
import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_AUTHENTICATED,
  ACCOUNT_TYPE_SUPER_ADMIN,
} from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import {
  checkIsAdmin,
  checkIsAuthenticated,
  checkIsSuperAdmin,
} from "src/utils/checkIsRoleExist";

interface IAuthGateProps {
  accountTypeToCheck: string;
  children: React.ReactNode;
}

export const AuthGate = ({ accountTypeToCheck, children }: IAuthGateProps) => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { roleList },
    },
  } = useContext(SessionContext);

  // other hooks
  // --------------------
  const router = useRouter();

  // logic
  // --------------------
  let isAuthorized = false;

  switch (accountTypeToCheck) {
    case ACCOUNT_TYPE_SUPER_ADMIN:
      isAuthorized = checkIsSuperAdmin(roleList);
      break;
    case ACCOUNT_TYPE_ADMIN:
      isAuthorized = checkIsAdmin(accountType, roleList);
      break;
    case ACCOUNT_TYPE_AUTHENTICATED:
      isAuthorized = checkIsAuthenticated(accountType, isAuthenticatedSession);
      break;
    default:
  }

  // side effects
  // --------------------
  useEffect(() => {
    if (!isAuthorized) {
      router.push("/sign-in?notAuthorized=true");
    }
  }, [isAuthorized, router]);

  // render
  // --------------------
  return <>{isAuthorized ? children : <Loading />}</>;
};
