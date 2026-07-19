"use client";

import {
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type {
  IReqRoleBehavioralStandardsItem,
  IResRoleRowItem,
} from "@/components/types/roles";
import {
  ROLE_BEHAVIORAL_STANDARDS_ID,
  SESSION_ROLE_ITEM_ADD,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { ensure } from "@/utils/ensure";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { signOut } from "@/utils/signOut";

interface IBehavioralStandardsProps {
  shiftboardId: string;
}

export const BehavioralStandards = ({
  shiftboardId,
}: IBehavioralStandardsProps) => {
  // context
  // ------------------------------------------------------------
  const {
    sessionDispatch,
    sessionState: {
      settings: { isAuthenticated },
      user: { playaName, worldName },
    },
  } = useContext(SessionContext);

  const { developerModeDispatch } = useContext(DeveloperModeContext);

  // state
  // ------------------------------------------------------------
  const [isSignedChecked, setIsSignedChecked] = useState(false);
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [isDeclinedLoading, setIsDeclinedLoading] = useState(false);
  const [isSignedLoading, setIsSignedLoading] = useState(false);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IResRoleRowItem;
    error: Error | undefined;
  } = useSWR(`/api/roles/${ROLE_BEHAVIORAL_STANDARDS_ID}`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/roles/behavioral-standards",
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const handleDecline = async () => {
    try {
      const body: IReqRoleBehavioralStandardsItem = {
        isBehavioralStandardsSigned: false,
        shiftboardId: ensure(shiftboardId),
      };

      // update database
      setIsDeclinedLoading(true);
      await trigger({
        body,
        method: "POST",
      });
      setIsDeclinedLoading(false);

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}
            &quot;
          </strong>{" "}
          has declined the <strong>Behavioral Standards Agreement</strong>
        </SnackbarText>,
        {
          variant: "warning",
        }
      );
      signOut(
        developerModeDispatch,
        enqueueSnackbar,
        isAuthenticated,
        playaName,
        router,
        sessionDispatch,
        worldName
      );
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
      }

      throw error;
    }
  };
  const handleSign = async () => {
    try {
      const body: IReqRoleBehavioralStandardsItem = {
        isBehavioralStandardsSigned: true,
        shiftboardId: ensure(shiftboardId),
      };

      // update database
      setIsSignedLoading(true);
      await trigger({
        body,
        method: "POST",
      });
      setIsSignedLoading(false);
      // update state
      sessionDispatch({
        payload: {
          id: ROLE_BEHAVIORAL_STANDARDS_ID,
          name: data.name,
        },
        type: SESSION_ROLE_ITEM_ADD,
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}
            &quot;
          </strong>{" "}
          has signed the <strong>Behavioral Standards Agreement</strong>
        </SnackbarText>,
        {
          variant: "success",
        }
      );

      // route to volunteer info page (replaces the old account page)
      router.push(`/volunteers/${shiftboardId}/info`);
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
      }

      throw error;
    }
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/placement-hq.jpg)",
          // the "PLACEMENT" sign sits high in the frame; anchor the focal
          // point up so it stays fully visible under the hero crop
          // (papabear 2026-07-02)
          backgroundPosition: "center 15%",
          backgroundSize: "cover",
        }}
        text="Behavioral Standards Agreement"
      />
      <Container component="main">
        <Box component="section">
          <Card>
            <CardContent>
              <Stack alignItems="center" direction="row">
                <WarningIcon
                  color="secondary"
                  fontSize="large"
                  sx={{ mr: 1 }}
                />
                <Typography>
                  All members of the BRC PEERS volunteer team are asked to
                  review and digitally sign this document.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Burning Man&apos;s Behavioral Standards Agreement
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                <strong>
                  <em>
                    Burning Man&apos;s culture honors and promotes freedom of
                    expression, unless that expression harms others.
                  </em>
                </strong>{" "}
                The Burning Man organization that supports the year-round
                activities of the Burning Man community, has zero tolerance for
                behavior that is non-consensual, abusive, or harmful to others.
                This includes and is not limited to:
              </Typography>
              <List sx={{ listStyle: "disc", pl: 4 }}>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Violence – both physical and verbal" />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Harassment, including non-consensual interactions, as stated in our Harassment, Discrimination and Retaliation Prevention Policy" />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Speech or expressions that demean, vilify, or perpetuate stereotypes against individuals or groups based on their protected characteristics" />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Coercion (abuse of power – including but not limited to sex, drugs, resources, etc.)" />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Sexual Assault" />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Intoxication while on duty" />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Theft or vandalism" />
                </ListItem>
              </List>
              <Typography>
                I agree, as volunteer staff, to abide by this{" "}
                <strong>Behavioral Standards Agreement</strong>. Nothing in this
                Agreement modifies, conflicts or affects the Burning Man
                Harassment, Discrimination and Retaliation Prevention Policy.
              </Typography>
              <Typography>
                In addition to the above, I agree to be my awesome self, look
                out for others and encourage the good in all!
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Acknowledgement
          </Typography>
          <Card>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSignedChecked}
                    color="secondary"
                    onChange={() => setIsSignedChecked((prev) => !prev)}
                  />
                }
                label="I understand that by clicking the checkbox and Sign agreement button, I acknowledge that I have read this document, and will abide by these standards to the best of my abilities."
              />
            </CardContent>
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
                onClick={() => setIsDeclineDialogOpen(true)}
                startIcon={
                  isDeclinedLoading ? (
                    <CircularProgress size="1rem" />
                  ) : (
                    <CloseIcon />
                  )
                }
                type="button"
                variant="outlined"
              >
                Decline agreement
              </Button>
              <Button
                disabled={isMutating || !isSignedChecked}
                onClick={handleSign}
                startIcon={
                  isSignedLoading ? (
                    <CircularProgress size="1rem" />
                  ) : (
                    <CheckIcon />
                  )
                }
                type="button"
                variant="contained"
              >
                Sign agreement
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Container>

      {/* Confirm decline — declining releases all shifts, then signs out
          (per stickybeak 2026-07-19). */}
      <Dialog
        open={isDeclineDialogOpen}
        onClose={() => setIsDeclineDialogOpen(false)}
        aria-labelledby="decline-dialog-title"
      >
        <DialogTitle id="decline-dialog-title">
          Decline Behavioral Standards Agreement?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            If you decline the Behavioral Standards Agreement, you will not be
            able to volunteer for PEERS, and any shifts you have already claimed
            will be released. Are you sure you wish to decline?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button
            disabled={isDeclinedLoading}
            onClick={() => setIsDeclineDialogOpen(false)}
            type="button"
            variant="outlined"
          >
            No
          </Button>
          <Button
            disabled={isDeclinedLoading}
            onClick={() => {
              setIsDeclineDialogOpen(false);
              handleDecline();
            }}
            startIcon={
              isDeclinedLoading ? (
                <CircularProgress size="1rem" />
              ) : (
                <CheckIcon />
              )
            }
            type="button"
            variant="contained"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
