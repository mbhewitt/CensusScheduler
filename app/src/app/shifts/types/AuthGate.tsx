import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { ShiftTypes } from "src/app/shifts/types/ShiftTypes";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";
import { Loading } from "src/components/general/Loading";

export const AuthGate = () => {
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
  }, [router]);

  // render
  // --------------------
  return <>{isSuperAdmin ? <ShiftTypes /> : <Loading />}</>;
};
