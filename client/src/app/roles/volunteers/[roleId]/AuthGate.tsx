"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { RoleVolunteers } from "src/app/roles/volunteers/[roleId]/RoleVolunteers";
import { Loading } from "src/components/general/Loading";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAdmin } from "src/utils/checkIsRoleExist";

interface IAuthGateProps {
  roleId: string;
}

export const AuthGate = ({ roleId }: IAuthGateProps) => {
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
  }, [isAdmin, router]);

  // render
  // --------------------
  return <>{isAdmin ? <RoleVolunteers roleId={roleId} /> : <Loading />}</>;
};
