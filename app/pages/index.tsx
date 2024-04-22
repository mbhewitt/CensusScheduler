import Head from "next/head";

import { Home } from "src/components/home";

const HomePage = () => {
  // render
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Home</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <Home />
    </>
  );
};

export default HomePage;
