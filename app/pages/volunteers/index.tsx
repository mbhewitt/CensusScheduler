import Head from "next/head";
import { useContext } from "react";

import { SignIn } from "src/components/sign-in";
import { Volunteers } from "src/components/volunteers";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { authenticatedCheck } from "src/utils/authenticatedCheck";
import { coreCrewCheck } from "src/utils/coreCrewCheck";

const VolunteersPage = () => {
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { roleList },
    },
  } = useContext(SessionContext);
  const isAuthenticated = authenticatedCheck(
    accountType,
    isAuthenticatedSession
  );
  const isCoreCrew = coreCrewCheck(accountType, roleList);

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
