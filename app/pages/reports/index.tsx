import Head from "next/head";

import { Reports } from "src/components/reports";

const ReportsPage = () => {
  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Reports</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <Reports />
    </>
  );
};

export default ReportsPage;
