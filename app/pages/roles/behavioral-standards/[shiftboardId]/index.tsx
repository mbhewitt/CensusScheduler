import Head from "next/head";

import { BehavioralStandards } from "src/components/roles/behavioral-standards";

const BehavioralStandardsPage = () => {
  // render
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Behavioral Standards Agreement</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <BehavioralStandards />
    </>
  );
};

export default BehavioralStandardsPage;
