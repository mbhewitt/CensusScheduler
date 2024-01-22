import Head from "next/head";
import { useContext } from "react";

import { SignIn } from "src/components/sign-in";
import { Volunteers } from "src/components/volunteers";
import { SessionContext } from "src/state/session/context";

const VolunteersPage = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { isCoreCrew },
    },
  } = useContext(SessionContext);

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
