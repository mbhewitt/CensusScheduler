import Head from "next/head";

import { CreateAccount } from "src/components/volunteers/CreateAccount";

const CreateAccountPage = () => {
  return (
    <>
      <Head>
        <title>Census | Create account</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <CreateAccount />
    </>
  );
};

export default CreateAccountPage;
