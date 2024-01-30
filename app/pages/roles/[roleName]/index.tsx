import Head from "next/head";
import { useContext } from "react";

import { RoleVolunteers } from "src/components/role-volunteers";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";

const RoleVolunteersPage = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { isCoreCrew },
    },
  } = useContext(SessionContext);

  return (
    <>
      <Head>
        <title>Census | Role</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isAuthenticated && isCoreCrew ? <RoleVolunteers /> : <SignIn />}
    </>
  );
};

export default RoleVolunteersPage;
