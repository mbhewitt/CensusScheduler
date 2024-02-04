import {
  Groups3 as Groups3Icon,
  LockReset as LockResetIcon,
  ManageAccounts as ManageAccountsIcon,
  Send as SendIcon,
  Verified as VerifiedIcon,
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
import Image from "next/image";
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
import { VolunteerShifts } from "src/components/volunteer-shifts";
import { DeveloperMode } from "src/components/volunteers/DeveloperMode";
import { ResetPasscodeDialog } from "src/components/volunteers/ResetPasscodeDialog";
import { SessionContext } from "src/state/session/context";
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
export const VolunteerAccount = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { isCoreCrew },
    },
  } = useContext(SessionContext);
  const [isMounted, setIsMounted] = useState(false);
  const [isResetPasscodeDialogOpen, setIsResetPasscodeDialogOpen] =
    useState(false);
  const router = useRouter();
  const { shiftboardId } = router.query;
  const { data, error } = useSWR(
    isMounted ? `/api/volunteers/${shiftboardId}` : null,
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    "/api/volunteers",
    fetcherTrigger
  );
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

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
      } = data.volunteerItem;

      reset({
        email,
        emergencyContact: emergencyContact ?? "",
        location: location ?? "",
        notes: notes ?? "",
        phone,
        playaName,
        worldName,
      });
    }
  }, [data, reset]);

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const { isNewAccount, playaName, roleList, worldName } = data.volunteerItem;

  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      await trigger({ body: { ...dataForm, shiftboardId }, method: "PATCH" });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {dataForm.playaName} &quot;{dataForm.worldName}&quot;
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

  return (
    <>
      <Hero
        Image={
          <Image
            alt="census art car illuminating at night"
            fill
            priority
            src="/account/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Account"
      />
      <Container component="main">
        {/* admin */}
        {isAuthenticated && isCoreCrew && (
          <Box component="section">
            <Breadcrumbs>
              <Link href="/volunteers">
                <Typography
                  sx={{
                    alignItems: "center",
                    display: "flex",
                    textDecoration: "underline",
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
                {playaName} &quot;{worldName}&quot;
              </Typography>
            </Breadcrumbs>
          </Box>
        )}

        {/* only new accounts are allowed to update their profile */}
        {!isNewAccount && (
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
                          disabled={isMutating}
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
                          disabled={!isNewAccount || isMutating}
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
                          disabled={!isNewAccount || isMutating}
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
                          disabled={!isNewAccount || isMutating}
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
                          disabled={isMutating}
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
                          disabled={isMutating}
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
                    isMutating ? <CircularProgress size="1rem" /> : <SendIcon />
                  }
                  type="submit"
                  variant="contained"
                >
                  Update
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
        {isAuthenticated && isCoreCrew && (
          <Box component="section">
            <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
              Admin
            </Typography>
            <Card>
              <CardContent>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography component="h3" variant="h6" sx={{ mb: 1 }}>
                      Roles
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <List disablePadding>
                      {roleList.length ? (
                        <>
                          {roleList.map((roleItem: string) => (
                            <ListItem disablePadding key={`${roleItem}-item`}>
                              <ListItemIcon sx={{ minWidth: "auto", pr: 1 }}>
                                <VerifiedIcon color="secondary" />
                              </ListItemIcon>
                              <ListItemText>{roleItem}</ListItemText>
                            </ListItem>
                          ))}
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
                    <Typography component="h3" variant="h6" sx={{ mb: 1 }}>
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
                            disabled={isMutating}
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
                              <SendIcon />
                            )
                          }
                          sx={{ mt: 2 }}
                          type="submit"
                          variant="contained"
                        >
                          Update
                        </Button>
                      </Stack>
                    </form>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography component="h3" variant="h6" sx={{ mb: 1 }}>
                      Security
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        onClick={() => setIsResetPasscodeDialogOpen(true)}
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
        handleResetPasscodeDialogClose={() =>
          setIsResetPasscodeDialogOpen(false)
        }
        isResetPasscodeDialogOpen={isResetPasscodeDialogOpen}
        shiftboardId={shiftboardId as string}
        playaName={playaName}
        worldName={worldName}
      />
    </>
  );
};
