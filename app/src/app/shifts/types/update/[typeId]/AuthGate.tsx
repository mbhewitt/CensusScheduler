import { useContext, useEffect } from "react";

import { ShiftTypesUpdate } from "src/app/shifts/types/update/[typeId]/ShiftTypesUpdate";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";
import { Loading } from "src/components/general/Loading";
import { useRouter } from "next/navigation";

interface IAuthGateProps {
  typeId: string;
}

export const AuthGate = ({ typeId }: IAuthGateProps) => {
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
  return (
    <>{isSuperAdmin ? <ShiftTypesUpdate typeId={typeId} /> : <Loading />}</>
  );
};
