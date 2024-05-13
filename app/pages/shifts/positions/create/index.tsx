import Head from "next/head";
import { useContext } from "react";

import { ShiftPositionsCreate } from "src/components/shifts/positions/position/ShiftPositionsCreate";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const ShiftPositionsCreatePage = () => {
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
        <title>Census | Create shift position</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <ShiftPositionsCreate /> : <SignIn />}
    </>
  );
};

export default ShiftPositionsCreatePage;
