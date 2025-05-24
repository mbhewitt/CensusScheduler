"use client";

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
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { PasscodeDialogUpdate } from "@/app/volunteers/[shiftboardId]/account/PasscodeDialogUpdate";
import { VolunteerShifts } from "@/app/volunteers/[shiftboardId]/account/VolunteerShifts";
import { BreadcrumbsNav } from "@/components/general/BreadcrumbsNav";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type {
  IReqVolunteerAccount,
  IResVolunteerAccount,
  IResVolunteerRoleItem,
} from "@/components/types/volunteers";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin } from "@/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import {
  HELPER_TEXT_EMERGENCY_CONTACT,
  HELPER_TEXT_LOCATION,
} from "@/constants";

interface IAccountProps {
  shiftboardId: number;
}
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
export const Account = ({ shiftboardId }: IAccountProps) => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { roleList: roleListSession },
    },
  } = useContext(SessionContext);

  // state
  // ------------------------------------------------------------
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IResVolunteerAccount;
    error: Error | undefined;
  } = useSWR(`/api/volunteers/${shiftboardId}/account`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/account`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const { isCreated, playaName, roleList: roleListData, worldName } = data;
  const isAdmin = checkIsAdmin(accountType, roleListSession);

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqVolunteerAccount = formValues;

      await trigger({ body, method: "PATCH" });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {formValues.playaName} &quot;{formValues.worldName}&quot;
          </strong>
          &apos;s account has been updated
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
  // ------------------------------------------------------------
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
        {isAdmin && (
          <Box component="section">
            <BreadcrumbsNav>
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
            </BreadcrumbsNav>
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
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Profile
          </Typography>
          <Card>
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={6}>
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
                  <Grid size={6}>
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
                  <Grid size={6}>
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
                  <Grid size={6}>
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
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name="location"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          helperText={HELPER_TEXT_LOCATION}
                          label="Location"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          helperText={HELPER_TEXT_EMERGENCY_CONTACT}
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
          <VolunteerShifts shiftboardId={shiftboardId} />
        </Box>

        {/* admin */}
        {isAdmin && (
          <Box component="section">
            <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
              Admin
            </Typography>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Grid container>
                  <Grid size={4}>
                    <Typography component="h3" variant="h6">
                      Roles
                    </Typography>
                  </Grid>
                  <Grid size={8}>
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
                </Grid>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Grid container>
                  <Grid size={4}>
                    <Typography component="h3" variant="h6">
                      Notes
                    </Typography>
                  </Grid>
                  <Grid size={8}>
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
                  <Grid size={4}>
                    <Typography component="h3" variant="h6">
                      Security
                    </Typography>
                  </Grid>
                  <Grid size={8}>
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        startIcon={<LockResetIcon />}
                        type="button"
                        variant="contained"
                      >
                        Update passcode
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>

      {/* passcode update dialog */}
      <PasscodeDialogUpdate
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={isDialogOpen}
        playaName={playaName}
        shiftboardId={shiftboardId}
        worldName={worldName}
      />
    </>
  );
};
