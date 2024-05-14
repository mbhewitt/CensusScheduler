import { Send as SendIcon } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import Image from "next/image";
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
import { IReqContact } from "src/components/types/contact";
import type { IResVolunteerDefaultItem } from "src/components/types/volunteers";
import { GENERAL_ROLE_LIST } from "src/constants";
import { SessionContext } from "src/state/session/context";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  email: string;
  isReplyWanted: boolean;
  message: string;
  name: string;
  to: string;
}

const defaultValues: IFormValues = {
  email: "",
  isReplyWanted: false,
  message: "",
  name: "",
  to: "Volunteer Coordinator",
};
export const Contact = () => {
  // context
  // --------------------
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { email, playaName, worldName },
    },
  } = useContext(SessionContext);

  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResVolunteerDefaultItem[];
    error: Error | undefined;
  } = useSWR("/api/volunteers/dropdown?filter=core", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/contact",
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // --------------------
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);
  useEffect(() => {
    if (isMounted && isAuthenticated) {
      reset({
        ...defaultValues,
        email,
        name: `${playaName} "${worldName}"`,
        to:
          router.query.reminder === "true"
            ? "Send me a reminder"
            : "Volunteer Coordinator",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isMounted]);

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqContact = formValues;

      // update database
      await trigger({ body, method: "POST" });

      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          Message from <strong>{formValues.name}</strong> at{" "}
          <strong>{formValues.email}</strong> has been recorded
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
        Image={
          <Image
            alt="census camp illuminated"
            fill
            priority
            src="/contact/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Contact"
      />
      <Container component="main">
        <Card>
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        error={Boolean(errors.name)}
                        fullWidth
                        helperText={errors.name?.message}
                        label="Name"
                        required
                        variant="standard"
                      />
                    )}
                    rules={{
                      required: "Name is required",
                      validate: (value) => {
                        return Boolean(value.trim()) || "Name is required";
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        error={Boolean(errors.email)}
                        fullWidth
                        helperText={errors.email?.message}
                        label="Email"
                        required
                        type="email"
                        variant="standard"
                      />
                    )}
                    rules={{
                      required: "Email is required",
                      validate: (value) => {
                        return Boolean(value.trim()) || "Email is required";
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    control={control}
                    name="to"
                    render={({ field }) => (
                      <FormControl fullWidth variant="standard">
                        <InputLabel id="to">To *</InputLabel>
                        <Select {...field} label="To *" labelId="to" required>
                          <MenuItem
                            key="Send me a reminder"
                            value="Send me a reminder"
                            sx={{ pl: 4 }}
                          >
                            Send me a reminder
                          </MenuItem>
                          <ListSubheader>General roles</ListSubheader>
                          {GENERAL_ROLE_LIST.map((generalRoleItem) => (
                            <MenuItem
                              key={`${generalRoleItem}`}
                              value={generalRoleItem}
                              sx={{ pl: 4 }}
                            >
                              {generalRoleItem}
                            </MenuItem>
                          ))}
                          <ListSubheader>Core volunteers</ListSubheader>
                          {data.map(({ playaName, worldName }) => (
                            <MenuItem
                              key={`${playaName}-${worldName}`}
                              value={`${playaName} "${worldName}"`}
                              sx={{ pl: 4 }}
                            >
                              {`${playaName} "${worldName}"`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={6} />
                <Grid item xs={6}>
                  <Controller
                    control={control}
                    name="isReplyWanted"
                    render={({ field: { value, ...field } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={value}
                            color="secondary"
                          />
                        }
                        label="Reply wanted after Burning Man"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    control={control}
                    name="message"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        error={Boolean(errors.message)}
                        fullWidth
                        helperText={errors.message?.message}
                        label="Message"
                        multiline
                        required
                        variant="standard"
                      />
                    )}
                    rules={{
                      required: "Message is required",
                      validate: (value) => {
                        return Boolean(value.trim()) || "Message is required";
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions
              sx={{
                justifyContent: "flex-end",
                pb: 2,
                pr: 2,
                pt: 0,
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
                Send message
              </Button>
            </CardActions>
          </form>
        </Card>
      </Container>
    </>
  );
};
