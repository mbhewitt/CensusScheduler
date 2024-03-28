import Head from "next/head";

import { CreateShift } from "src/components/shifts/CreateShift";

const CreateShiftPage = () => {
  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Create shift</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <CreateShift />
    </>
  );
};

export default CreateShiftPage;
