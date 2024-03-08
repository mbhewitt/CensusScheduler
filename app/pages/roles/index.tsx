import Head from "next/head";
import { useContext } from "react";

import { Roles } from "src/components/roles";
import { SignIn } from "src/components/sign-in";
import { CORE_CREW_ID } from "src/constants";
import { SessionContext } from "src/state/session/context";
import { checkRole } from "src/utils/checkRole";

const RolesPage = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { roleList },
    },
  } = useContext(SessionContext);
  const isCoreCrew = checkRole(CORE_CREW_ID, roleList);

  return (
    <>
      <Head>
        <title>Census | Roles</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isAuthenticated && isCoreCrew ? <Roles /> : <SignIn />}
    </>
  );
};

export default RolesPage;
