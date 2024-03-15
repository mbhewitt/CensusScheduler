import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

import { Loading } from "src/components/general/Loading";
import { SignIn } from "src/components/sign-in";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { authenticatedCheck } from "src/utils/authenticatedCheck";

const SignInPage = () => {
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { shiftboardId },
    },
  } = useContext(SessionContext);
  const router = useRouter();
  const isAuthenticated = authenticatedCheck(
    accountType,
    isAuthenticatedSession
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/account/${shiftboardId}`);
    }
  }, [isAuthenticated, router, shiftboardId]);

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
