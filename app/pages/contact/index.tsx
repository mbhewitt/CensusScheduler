import Head from "next/head";

import { Contact } from "src/components/contact";

const ContactPage = () => {
  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Contact</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      <Contact />
    </>
  );
};

export default ContactPage;
