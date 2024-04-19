import Head from "next/head";
import { useContext } from "react";

import { ShiftTypes } from "src/components/shifts/types";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const ShiftTypesPage = () => {
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
        <title>Census | Shift types</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <ShiftTypes /> : <SignIn />}
    </>
  );
};

export default ShiftTypesPage;
