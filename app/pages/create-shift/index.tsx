import Head from "next/head";
import { useContext } from "react";

import { ShiftCreate } from "src/components/shifts/ShiftCreate";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const ShiftCreatePage = () => {
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

  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Create shift</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <ShiftCreate /> : <SignIn />}
    </>
  );
};

export default ShiftCreatePage;
