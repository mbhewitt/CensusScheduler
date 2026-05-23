"use client";

import {
  Check as CheckIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { useSnackbar } from "notistack";
import { useContext } from "react";
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
  const { isMutating, trigger } = useSWRMutation(
    `/api/training/confirmation/${code}`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

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

  const handleConfirm = async () => {
    try {
      const body: IReqTrainingConfirm = { shiftboardId };
      await trigger({ method: "POST", body });
      // update client-side role list so the rest of the app knows
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
      // refetch so alreadyConfirmed flips and shifts list is fresh
      mutate();
    } catch (e) {
      if (e instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{e.message}</strong>
          </SnackbarText>,
          { persist: true, variant: "error" }
        );
      }
    }
  };

  const { training, volunteer, alreadyConfirmed, availableShifts } = data;

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
                  : `Hi ${volunteer.playaName}! Confirm your completion of ${training.name} to unlock shifts that require this training.`}
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
            {!alreadyConfirmed && (
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  pb: 2,
                  pt: 0,
                  pr: 2,
                }}
              >
                <Button
                  disabled={isMutating}
                  onClick={handleConfirm}
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <CheckIcon />
                    )
                  }
                  type="button"
                  variant="contained"
                >
                  Confirm
                </Button>
              </CardActions>
            )}
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" sx={{ mb: 2 }} variant="h6">
            {alreadyConfirmed
              ? `Sign up for shifts that need ${training.name}:`
              : `Available shifts requiring ${training.name}:`}
          </Typography>
          {availableShifts.length === 0 ? (
            <Typography>
              There are no open shifts requiring {training.name} at this time.
            </Typography>
          ) : (
            <Card>
              <List>
                {availableShifts.map((shift) => (
                  <ListItem
                    key={`${shift.shiftTimesId}-${shift.positionId}`}
                    component={NextLink}
                    href={`/shifts/${shift.shiftTimesId}/volunteers`}
                  >
                    <ListItemText
                      primary={`${shift.shiftName} — ${shift.position}`}
                      secondary={`${shift.dateName || shift.startTime} · ${shift.department}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}
        </Box>
      </Container>
    </>
  );
};
