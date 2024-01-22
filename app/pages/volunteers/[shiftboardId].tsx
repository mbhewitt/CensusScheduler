import Head from "next/head";
import { useContext } from "react";

import { SignIn } from "src/components/sign-in";
import { VolunteerAccount } from "src/components/volunteers/VolunteerAccount";
import { SessionContext } from "src/state/session/context";

const VolunteersPage = () => {
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
      {isAuthenticated ? <VolunteerAccount /> : <SignIn />}
    </>
  );
};

export default VolunteersPage;
