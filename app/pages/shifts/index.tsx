import Head from "next/head";

import { Shifts } from "src/components/shifts";

const ShiftsPage = () => {
  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Shifts</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <Shifts />
    </>
  );
};

export default ShiftsPage;
