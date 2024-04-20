import Head from "next/head";
import { useContext } from "react";

import { ShiftTypeCreate } from "src/components/shifts/types/ShiftTypeCreate";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const ShiftTypeCreatePage = () => {
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
        <title>Census | Create shift type</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <ShiftTypeCreate /> : <SignIn />}
    </>
  );
};

export default ShiftTypeCreatePage;
