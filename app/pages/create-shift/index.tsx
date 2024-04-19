import Head from "next/head";
import { useContext } from "react";

import { CreateShift } from "src/components/shifts/CreateShift";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";

const CreateShiftPage = () => {
  // context
  // --------------------
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // logic
  // --------------------
  const isSuperAdmin = checkIsSuperAdmin(roleList);

  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Create shift</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isSuperAdmin ? <CreateShift /> : <SignIn />}
    </>
  );
};

export default CreateShiftPage;
