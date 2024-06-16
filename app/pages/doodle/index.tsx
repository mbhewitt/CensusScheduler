import Head from "next/head";

import { Doodle } from "src/components/doodle";

const DoodlePage = () => {
  // render
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Doodle</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <Doodle />
    </>
  );
};

export default DoodlePage;
