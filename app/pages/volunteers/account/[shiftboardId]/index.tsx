import Head from "next/head";
import { useContext } from "react";

import { SignIn } from "src/components/sign-in";
import { Account } from "src/components/volunteers/account";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAuthenticated } from "src/utils/checkIsRoleExist";

const AccountPage = () => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
    },
  } = useContext(SessionContext);

  // logic
  // --------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );

  // render
  // --------------------
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
