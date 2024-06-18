import {
  AccountCircle as AccountCircleIcon,
  Groups3 as Groups3Icon,
  LockReset as LockResetIcon,
  ManageAccounts as ManageAccountsIcon,
  SpeakerNotes as SpeakerNotesIcon,
  VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type {
  IReqVolunteerAccount,
  IResVolunteerAccount,
  IResVolunteerRoleItem,
} from "src/components/types/volunteers";
import { DeveloperMode } from "src/components/volunteers/account/DeveloperMode";
import { ResetPasscodeDialog } from "src/components/volunteers/account/ResetPasscodeDialog";
import { VolunteerShifts } from "src/components/volunteers/shifts";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAdmin, checkIsAuthenticated } from "src/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  email: string;
  emergencyContact: string;
  location: string;
  notes: string;
  phone: string;
  playaName: string;
  worldName: string;
}

const defaultValues: IFormValues = {
  email: "",
  emergencyContact: "",
  location: "",
  notes: "",
  phone: "",
  playaName: "",
  worldName: "",
};
export const Account = () => {
  // context
  // --------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { roleList: roleListSession },
      settings: { isAuthenticated: isAuthenticatedSession },
    },
  } = useContext(SessionContext);

  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { shiftboardId } = router.query;
  const {
    data,
    error,
  }: {
    data: IResVolunteerAccount;
    error: Error | undefined;
  } = useSWR(
    isMounted ? `/api/volunteers/account/${shiftboardId}` : null,
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteers/account/${shiftboardId}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // --------------------
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);
  useEffect(() => {
    if (data) {
      const {
        email,
        emergencyContact,
        location,
        notes,
        phone,
        playaName,
        worldName,
      } = data;

      reset({
        email,
        emergencyContact,
        location,
        notes,
        phone,
        playaName,
        worldName,
      });
    }
  }, [data, reset]);

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const { isCreated, playaName, roleList: roleListData, worldName } = data;
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const isAdmin = checkIsAdmin(accountType, roleListSession);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqVolunteerAccount = formValues;

      await trigger({ body, method: "PATCH" });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {formValues.playaName} &quot;{formValues.worldName}&quot;
          </strong>
          &apos;s profile has been updated
        </SnackbarText>,
        {
          variant: "success",
        }
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

  // render
  // --------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/man-at-night.jpg)",
          backgroundSize: "cover",
        }}
        text="Account"
      />
      <Container component="main">
        {/* admin */}
        {isAuthenticated && isAdmin && (
          <Box component="section">
            <Breadcrumbs>
              <Link href="/volunteers">
                <Typography
                  sx={{
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  <Groups3Icon sx={{ mr: 0.5 }} />
                  Volunteers
                </Typography>
              </Link>
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <ManageAccountsIcon sx={{ mr: 0.5 }} />
                Account
              </Typography>
            </Breadcrumbs>
          </Box>
        )}

        {/* only new accounts are allowed to update their profile */}
        {!isCreated && (
          <Box component="section">
            <Card>
              <CardContent>
                <Typography>
                  World name, email, and phone number fields are displayed for
                  reference only. You can update your playa name below for this
                  Census season, but it won&apos;t affect your Burner profile or
                  carry over to future seasons.
                </Typography>
                <Typography>
                  To officially update your information, visit{" "}
                  <strong>https://profiles.burningman.org/</strong> after the
                  event.
                </Typography>
                <Typography>
                  You can send yourself a reminder on the{" "}
                  <Link
                    href={{ pathname: "/contact", query: { reminder: true } }}
                  >
                    Contact
                  </Link>{" "}
                  page.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* profile */}
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Profile
          </Typography>
          <Card>
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Controller
                      control={control}
                      name="playaName"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Playa / preferred name"
                          required
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      control={control}
                      name="worldName"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled={!isCreated}
                          fullWidth
                          label="Default world name"
                          required
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled={!isCreated}
                          fullWidth
                          label="Email"
                          required
                          type="email"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled={!isCreated}
                          fullWidth
                          label="Phone"
                          type="phone"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      control={control}
                      name="location"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Location"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      control={control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Emergency contact"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  pb: 2,
                  pt: 0,
                  px: 2,
                }}
              >
                <Button
                  disabled={isMutating}
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <AccountCircleIcon />
                    )
                  }
                  type="submit"
                  variant="contained"
                >
                  Update profile
                </Button>
              </CardActions>
            </form>
          </Card>
        </Box>

        {/* volunteer shifts */}
        <Box component="section">
          <VolunteerShifts />
        </Box>

        {/* admin */}
        {isAuthenticated && isAdmin && (
          <Box component="section">
            <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
              Admin
            </Typography>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography component="h3" variant="h6">
                      Roles
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <List disablePadding>
                      {roleListData.length ? (
                        <>
                          {roleListData.map(
                            ({
                              id: roleId,
                              name: roleName,
                            }: IResVolunteerRoleItem) => {
                              return (
                                <ListItem disablePadding key={`${roleId}-item`}>
                                  <ListItemIcon sx={{ pr: 1 }}>
                                    <VerifiedUserIcon color="secondary" />
                                  </ListItemIcon>
                                  <ListItemText>{roleName}</ListItemText>
                                </ListItem>
                              );
                            }
                          )}
                        </>
                      ) : (
                        <ListItem disablePadding>None</ListItem>
                      )}
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography component="h3" variant="h6">
                      Notes
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                      <Controller
                        control={control}
                        name="notes"
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            variant="standard"
                          />
                        )}
                      />
                      <Stack direction="row" justifyContent="flex-end">
                        <Button
                          disabled={isMutating}
                          startIcon={
                            isMutating ? (
                              <CircularProgress size="1rem" />
                            ) : (
                              <SpeakerNotesIcon />
                            )
                          }
                          sx={{ mt: 2 }}
                          type="submit"
                          variant="contained"
                        >
                          Update notes
                        </Button>
                      </Stack>
                    </form>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography component="h3" variant="h6">
                      Security
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        startIcon={<LockResetIcon />}
                        type="button"
                        variant="contained"
                      >
                        Reset passcode
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  {/* developer mode */}
                  <DeveloperMode />
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>

      {/* remove dialog */}
      <ResetPasscodeDialog
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={isDialogOpen}
        playaName={playaName}
        shiftboardId={shiftboardId}
        worldName={worldName}
      />
    </>
  );
};
