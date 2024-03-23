import Head from "next/head";
import { useContext } from "react";

import { SignIn } from "src/components/sign-in";
import { Volunteers } from "src/components/volunteers";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAuthenticated } from "src/utils/checkIsAuthenticated";
import { checkIsCoreCrew } from "src/utils/checkIsCoreCrew";

const VolunteersPage = () => {
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
  const isCoreCrew = checkIsCoreCrew(accountType, roleList);

  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Volunteers</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isAuthenticated && isCoreCrew ? <Volunteers /> : <SignIn />}
    </>
  );
};

export default VolunteersPage;
