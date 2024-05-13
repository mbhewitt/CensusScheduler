import Head from "next/head";
import { useContext } from "react";

import { ShiftPositionsUpdate } from "src/components/shifts/positions/position/ShiftPositionsUpdate";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const ShiftPositionsUpdatePage = () => {
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
        <title>Census | Update shift position</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <ShiftPositionsUpdate /> : <SignIn />}
    </>
  );
};

export default ShiftPositionsUpdatePage;
