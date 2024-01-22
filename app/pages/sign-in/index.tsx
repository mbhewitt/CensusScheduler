import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

import { Loading } from "src/components/general/Loading";
import { SignIn } from "src/components/sign-in";
import { SessionContext } from "src/state/session/context";

const SignInPage = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { shiftboardId },
    },
  } = useContext(SessionContext);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/volunteers/${shiftboardId}`);
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
