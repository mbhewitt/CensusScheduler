"use client";

import {
  Box,
  Card,
  CardContent,
  Container,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useRef } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type {
  IReqTrainingConfirm,
  IResTrainingConfirmation,
} from "@/components/types/confirm";
import { SESSION_ROLE_ITEM_ADD } from "@/constants";
import { SessionContext } from "@/state/session/context";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

interface ITrainingConfirmationProps {
  code: string;
}

export const TrainingConfirmation = ({ code }: ITrainingConfirmationProps) => {
  // context
  // ------------------------------------------------------------
  const {
    sessionDispatch,
    sessionState: {
      settings: { isAuthenticated },
      user: { shiftboardId },
    },
  } = useContext(SessionContext);
  const router = useRouter();

  // #649: without a live session the confirmation used to render an infinite
  // spinner and record NOTHING (no error, no prompt) — silently losing the
  // completion. Instead, send the volunteer to sign-in and return them here so
  // the completion is credited to the right account. Race-safe: fall back to
  // reading the persisted session directly, since the context's sessionStorage
  // hydration effect may not have run on this first render yet.
  const redirectedRef = useRef(false);
  const returnTo = `/training/confirmation/${code}`;
  const goSignIn = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  };
  useEffect(() => {
    let authed = isAuthenticated;
    if (!authed) {
      try {
        authed = Boolean(
          JSON.parse(sessionStorage.getItem("sessionState") ?? "{}")?.settings
            ?.isAuthenticated
        );
      } catch {
        /* sessionStorage unavailable — treat as unauthenticated */
      }
    }
    if (!authed) goSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // fetching, mutation, revalidation
  // ------------------------------------------------------------
  const swrKey = shiftboardId
    ? `/api/training/confirmation/${code}?shiftboardId=${shiftboardId}`
    : null;
  const {
    data,
    error,
    mutate,
  }: {
    data: IResTrainingConfirmation | undefined;
    error: Error | undefined;
    mutate: (opts?: unknown) => void;
  } = useSWR(swrKey, fetcherGet);
  const { trigger } = useSWRMutation(
    `/api/training/confirmation/${code}`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  // Auto-confirm on visit — per @mbhewitt 2026-05-23, visiting the page IS
  // the confirmation, no separate button click. Guarded by a ref so a
  // React-strict-mode double-mount doesn't double-fire (the POST is
  // idempotent on the server side either way, but no need to round-trip
  // twice). Only fires when the GET has loaded and reports
  // alreadyConfirmed:false.
  const autoFiredRef = useRef(false);
  useEffect(() => {
    if (!data) return;
    if ((data as unknown as { statusCode?: number }).statusCode) return;
    if (data.alreadyConfirmed) return;
    if (autoFiredRef.current) return;
    autoFiredRef.current = true;

    (async () => {
      try {
        const body: IReqTrainingConfirm = { shiftboardId };
        await trigger({ method: "POST", body });
        sessionDispatch({
          type: SESSION_ROLE_ITEM_ADD,
          payload: {
            id: data.training.roleId,
            name: data.training.roleName,
          },
        });
        enqueueSnackbar(
          <SnackbarText>
            <strong>{data.training.name}</strong> training confirmed
          </SnackbarText>,
          { variant: "success" }
        );
        mutate();
      } catch (e) {
        // Re-allow a retry on next interaction if it errored
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
  }, [
    data,
    shiftboardId,
    trigger,
    sessionDispatch,
    enqueueSnackbar,
    mutate,
  ]);

  // #649: a fetch error here is almost always an expired/invalid session
  // (server 401) — resume via sign-in rather than a dead-end error page.
  useEffect(() => {
    if (error) goSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // logic
  // ------------------------------------------------------------
  if (error) return <Loading />;
  if (!data) return <Loading />;
  // GET returns { statusCode, message } shaped objects on 404 / 400 — treat
  // those as the error page rather than rendering the success layout.
  if (
    (data as unknown as { statusCode?: number }).statusCode &&
    (data as unknown as { statusCode?: number }).statusCode !== 200
  ) {
    return <ErrorPage />;
  }

  const { training, volunteer, alreadyConfirmed } = data;

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Training confirmation"
      />
      <Container component="main">
        <Box component="section">
          <Card>
            <CardContent>
              <Typography component="h2" sx={{ mb: 1 }} variant="h5">
                {alreadyConfirmed
                  ? `Thank you, ${volunteer.playaName}, for confirming completion of ${training.name} training.`
                  : `Confirming your completion of ${training.name} training…`}
              </Typography>
              {alreadyConfirmed && (
                <>
                  <Typography sx={{ mb: 3 }}>
                    We have marked this training as complete on{" "}
                    <MuiLink
                      component={NextLink}
                      href={`/volunteers/${shiftboardId}/info`}
                    >
                      your volunteer account
                    </MuiLink>
                    .
                  </Typography>
                  <Typography component="h3" sx={{ mb: 1 }} variant="h6">
                    What&rsquo;s next?
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    View your existing shifts on your{" "}
                    <MuiLink
                      component={NextLink}
                      href={`/volunteers/${shiftboardId}/info`}
                    >
                      Account page
                    </MuiLink>
                    .
                  </Typography>
                  <Typography sx={{ mb: 2 }}>
                    View available shifts on the{" "}
                    <MuiLink component={NextLink} href="/shifts">
                      Shifts page
                    </MuiLink>
                    .
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Note: To review this training material later, use the
                    links from the completed checklist item on your account.
                    From there, you can return to the course on Hive or
                    view/print a PDF copy of the course.
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
