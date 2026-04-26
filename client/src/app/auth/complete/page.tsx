import { Suspense } from "react";

import { AuthComplete } from "@/app/auth/complete/AuthComplete";

export const metadata = {
  title: "Census | Signing in...",
};
const AuthCompletePage = () => {
  return (
    <Suspense>
      <AuthComplete />
    </Suspense>
  );
};

export default AuthCompletePage;
