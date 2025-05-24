"use client";

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
  Grid2 as Grid,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import { IReqContact } from "@/components/types/contact";
import type { IResVolunteerDefaultItem } from "@/components/types/volunteers";
import { GENERAL_ROLE_LIST } from "@/constants";
import { SessionContext } from "@/state/session/context";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

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
  // ------------------------------------------------------------
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { email, playaName, worldName },
    },
  } = useContext(SessionContext);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    const reminderParam = searchParams?.get("reminder");

    if (reminderParam && isAuthenticated) {
      reset({
        ...defaultValues,
        email: email ?? "",
        name: `${playaName} "${worldName}"`,
        to: reminderParam ? "Send me a reminder" : "Volunteer Coordinator",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // form submission
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/camp-at-night.jpg)",
          backgroundSize: "cover",
        }}
        text="Contact"
      />
      <Container component="main">
        <Card>
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={6}>
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
                <Grid size={6}>
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
                <Grid size={6}>
                  <Controller
                    control={control}
                    name="to"
                    render={({ field }) => (
                      <FormControl fullWidth required variant="standard">
                        <InputLabel id="to">To</InputLabel>
                        <Select {...field} label="To *" labelId="to">
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
                <Grid size={6}>
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
                <Grid size={12}>
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
