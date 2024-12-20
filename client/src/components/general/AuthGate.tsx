"use client";

import { useContext } from "react";

import { Loading } from "@/components/general/Loading";
import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_AUTHENTICATED,
  ACCOUNT_TYPE_SUPER_ADMIN,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import {
  checkIsAdmin,
  checkIsAuthenticated,
  checkIsSuperAdmin,
} from "@/utils/checkIsRoleExist";

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

  // logic
  // --------------------
  let isAuthorized = false;

  switch (accountTypeToCheck) {
    case ACCOUNT_TYPE_SUPER_ADMIN:
      isAuthorized = checkIsSuperAdmin(accountType, roleList);
      break;
    case ACCOUNT_TYPE_ADMIN:
      isAuthorized = checkIsAdmin(accountType, roleList);
      break;
    case ACCOUNT_TYPE_AUTHENTICATED:
      isAuthorized = checkIsAuthenticated(accountType, isAuthenticatedSession);
      break;
    default:
  }

  // render
  // --------------------
  return <>{isAuthorized ? children : <Loading />}</>;
};
