import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

import { Loading } from "src/components/general/Loading";
import { SignIn } from "src/components/sign-in";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAuthenticated } from "src/utils/checkIsAuthenticated";

const SignInPage = () => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

  // other hooks
  // --------------------
  const router = useRouter();

  // logic
  // --------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );

  // side effects
  // --------------------
  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/account/${shiftboardId}`);
    }
  }, [isAuthenticated, router, shiftboardId]);

  // display
  // --------------------
  return (
    <>
      <Head>
        <title>Census | Sign in</title>
        <meta name="description" content="" />
        <link rel="icon" href="/general/favicon.ico" />
      </Head>
      {isAuthenticated ? <Loading /> : <SignIn />}
    </>
  );
};

export default SignInPage;
