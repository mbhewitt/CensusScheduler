"use client";

import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Container,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
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
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

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

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
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
        <Box component="section" sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography component="h2" sx={{ mb: 1 }} variant="h5">
                {alreadyConfirmed
                  ? `Thank you, ${volunteer.playaName}, for confirming completion of ${training.name}!`
                  : `Confirming your completion of ${training.name}…`}
              </Typography>
              {alreadyConfirmed && (
                <Typography sx={{ mb: 1 }}>
                  Your <strong>{training.roleName}</strong> role has been added
                  to your account.
                </Typography>
              )}
              {training.url && (
                <Typography sx={{ mt: 2 }}>
                  <MuiLink
                    component={NextLink}
                    href={training.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Training course material{" "}
                    <OpenInNewIcon
                      fontSize="inherit"
                      sx={{ verticalAlign: "middle" }}
                    />
                  </MuiLink>
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Stack direction="row" spacing={2}>
            <MuiLink component={NextLink} href="/shifts">
              Browse shifts
            </MuiLink>
            <MuiLink
              component={NextLink}
              href={`/volunteers/${shiftboardId}/info`}
            >
              Your volunteer page
            </MuiLink>
          </Stack>
        </Box>
      </Container>
    </>
  );
};
