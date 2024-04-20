import Head from "next/head";

import { ShiftVolunteers } from "src/components/shifts/volunteers";

const ShiftVolunteersPage = () => {
  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Shift volunteers</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <ShiftVolunteers />
    </>
  );
};

export default ShiftVolunteersPage;
