"use client";

import { usePathname, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { Container, Typography } from "@mui/material";

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
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
  const pathname = usePathname();
  const router = useRouter();

  // logic
  // ------------------------------------------------------------
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

  // determine if user has any session at all
  // ------------------------------------------------------------
  const hasSession = isAuthenticatedSession;

  // redirect users without a session to sign-in with a return URL
  // users with a session but insufficient role see a fallback instead
  // ------------------------------------------------------------
  useEffect(() => {
    if (!isAuthorized && !hasSession) {
      if (pathname) {
        const returnTo = encodeURIComponent(pathname);
        router.replace(`/sign-in?returnTo=${returnTo}`);
      } else {
        router.replace("/sign-in");
      }
    }
  }, [isAuthorized, hasSession, pathname, router]);

  // render
  // ------------------------------------------------------------
  if (isAuthorized) {
    return <>{children}</>;
  }

  if (hasSession) {
    return (
      <Container
        component="main"
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          mt: 4,
        }}
      >
        <Typography>You don&apos;t have permission to view this page.</Typography>
      </Container>
    );
  }

  return <Loading />;
};
