"use client";

import { Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useRef } from "react";
import useSWRMutation from "swr/mutation";

import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IReqToggleEmailUnsubscribed } from "@/components/types/volunteer-info";
import {
  ROLE_EMAIL_UNSUBSCRIBED_ID,
  SESSION_ROLE_ITEM_ADD,
} from "@/constants";
import { SessionContext } from "@/state/session/context";
import { fetcherTrigger } from "@/utils/fetcher";

// Email-footer "Click here to unsubscribe" target. AuthGate on the page
// wrapper forces Okta sign-in first (with /sign-in?returnTo=/unsubscribe),
// so by the time this component mounts we have the authenticated
// shiftboardId from session. We auto-fire the POST exactly like the
// training-confirmation flow — visiting the page IS the action — then
// redirect to the info page's Settings section so the volunteer can see
// the result and re-subscribe if they want.
export const Unsubscribe = () => {
  const {
    sessionDispatch,
    sessionState: {
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

  const { trigger } = useSWRMutation(
    shiftboardId
      ? `/api/volunteers/${shiftboardId}/info/email-preference`
      : null,
    fetcherTrigger
  );

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // Guard against React-strict-mode double-mount. The POST is idempotent
  // server-side (SELECT-then-branch UPDATE/INSERT) but no need to round-trip
  // twice.
  const autoFiredRef = useRef(false);

  useEffect(() => {
    if (!shiftboardId) return;
    if (autoFiredRef.current) return;
    autoFiredRef.current = true;

    (async () => {
      try {
        const body: IReqToggleEmailUnsubscribed = { unsubscribed: true };
        await trigger({ body, method: "POST" });
        sessionDispatch({
          type: SESSION_ROLE_ITEM_ADD,
          payload: {
            id: ROLE_EMAIL_UNSUBSCRIBED_ID,
            name: "EmailUnsubscribed",
          },
        });
        enqueueSnackbar(
          <SnackbarText>
            You have been <strong>unsubscribed</strong> from Census emails. You
            can re-subscribe from your info page.
          </SnackbarText>,
          { variant: "success" }
        );
        router.replace(`/volunteers/${shiftboardId}/info#settings`);
      } catch (e) {
        autoFiredRef.current = false;
        if (e instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{e.message}</strong>
            </SnackbarText>,
            { persist: true, variant: "error" }
          );
        }
      }
    })();
  }, [shiftboardId, trigger, sessionDispatch, enqueueSnackbar, router]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Loading />
    </Container>
  );
};
