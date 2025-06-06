import { Suspense } from "react";

import { SignInAuthGate } from "@/app/sign-in/SignInAuthGate";

export const metadata = {
  title: "Census | Sign in",
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
