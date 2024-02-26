import Head from "next/head";
import { useContext } from "react";

import { SignIn } from "src/components/sign-in";
import { Account } from "src/components/volunteers/account";
import { SessionContext } from "src/state/session/context";

const AccountPage = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
    },
  } = useContext(SessionContext);

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
