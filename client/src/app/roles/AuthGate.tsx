"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { Roles } from "src/app/roles/Roles";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAdmin } from "src/utils/checkIsRoleExist";
import { Loading } from "src/components/general/Loading";

export const AuthGate = () => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
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
  const isAdmin = checkIsAdmin(accountType, roleList);

  // side effects
  // --------------------
  useEffect(() => {
    if (!isAdmin) {
      router.push("/sign-in");
    }
  }, [router]);

  // render
  // --------------------
  return <>{isAdmin ? <Roles /> : <Loading />}</>;
};
