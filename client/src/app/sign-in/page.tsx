import { Suspense } from "react";

import { SignInAuthGate } from "@/app/sign-in/SignInAuthGate";

export const metadata = {
  title: "PEERS | Sign in",
};
const SignInPage = () => {
  // render
  // ------------------------------------------------------------
  return (
    <Suspense>
      <SignInAuthGate />
    </Suspense>
  );
};

export default SignInPage;
