import { Suspense } from "react";

import { Contact } from "@/app/contact/Contact";

export const metadata = {
  title: "Census | Contact",
};
const ContactPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <Suspense>
      <Contact />
    </Suspense>
  );
};

export default ContactPage;
