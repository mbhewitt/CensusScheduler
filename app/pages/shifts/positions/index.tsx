import Head from "next/head";
import { useContext } from "react";

import { ShiftPositions } from "src/components/shifts/positions";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const ShiftPositionsPage = () => {
  // context
  // --------------------
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // logic
  // --------------------
  const isSuperAdmin = checkIsSuperAdmin(roleList);

  // render
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Shift positions</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <ShiftPositions /> : <SignIn />}
    </>
  );
};

export default ShiftPositionsPage;
