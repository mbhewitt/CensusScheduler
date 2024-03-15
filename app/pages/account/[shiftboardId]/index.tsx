import Head from "next/head";
import { useContext } from "react";

import { Account } from "src/components/account";
import { SignIn } from "src/components/sign-in";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { authenticatedCheck } from "src/utils/authenticatedCheck";

const AccountPage = () => {
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
    },
  } = useContext(SessionContext);
  const isAuthenticated = authenticatedCheck(
    accountType,
    isAuthenticatedSession
  );

  return (
    <>
      <Head>
        <title>Census | Account</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isAuthenticated ? <Account /> : <SignIn />}
    </>
  );
};

export default AccountPage;
