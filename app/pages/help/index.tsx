import Head from "next/head";

import { Help } from "src/components/help";

const HelpPage = () => {
  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Help</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <Help />
    </>
  );
};

export default HelpPage;
