import Head from "next/head";

import { AccountCreate } from "src/components/volunteers/account/create";

const AccountCreatePage = () => {
  // render
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Create account</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <AccountCreate />
    </>
  );
};

export default AccountCreatePage;
