"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useRef } from "react";

import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { SESSION_SIGN_IN } from "@/constants";
import { SessionContext } from "@/state/session/context";

export const AuthComplete = () => {
  // context
  // ------------------------------------------------------------
  const { sessionDispatch } = useContext(SessionContext);

  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const hasProcessed = useRef(false);

  // hydrate session from OAuth callback data
  // ------------------------------------------------------------
  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const dataParam = searchParams?.get("data");
    const returnTo = searchParams?.get("returnTo");

    if (!dataParam) {
      router.replace("/sign-in?error=missing_data");
      return;
    }

    try {
      const account = JSON.parse(decodeURIComponent(dataParam));

      sessionDispatch({
        payload: account,
        type: SESSION_SIGN_IN,
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {account.playaName} &quot;{account.worldName}&quot;
          </strong>{" "}
          has signed in
        </SnackbarText>,
        {
          variant: "success",
        }
      );

      const redirectPath =
        returnTo && returnTo.startsWith("/")
          ? returnTo
          : `/volunteers/${account.shiftboardId}/account`;
      router.replace(redirectPath);
    } catch {
      router.replace("/sign-in?error=invalid_data");
    }
  }, [enqueueSnackbar, router, searchParams, sessionDispatch]);

  // render
  // ------------------------------------------------------------
  return <Loading />;
};
