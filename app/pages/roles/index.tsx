import Head from "next/head";
import { useContext } from "react";

import { Roles } from "src/components/roles";
import { SignIn } from "src/components/sign-in";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAdmin, checkIsAuthenticated } from "src/utils/checkIsRoleExist";

const RolesPage = () => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { roleList },
    },
  } = useContext(SessionContext);

  // logic
  // --------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const isAdmin = checkIsAdmin(accountType, roleList);

  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Roles</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isAuthenticated && isAdmin ? <Roles /> : <SignIn />}
    </>
  );
};

export default RolesPage;
