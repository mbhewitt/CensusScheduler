import Head from "next/head";
import { useContext } from "react";

import { ShiftTypesUpdate } from "src/components/shifts/types/type/ShiftTypesUpdate";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const ShiftTypesUpdatePage = () => {
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
        <title>Census | Update shift type</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <ShiftTypesUpdate /> : <SignIn />}
    </>
  );
};

export default ShiftTypesUpdatePage;
