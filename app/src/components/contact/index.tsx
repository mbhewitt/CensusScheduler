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
import type { IDataVolunteerItem } from "src/components/types";
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
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { email, playaName, worldName },
    },
  } = useContext(SessionContext);
  const [isMounted, setIsMounted] = useState(false);
  const { data, error } = useSWR("/api/volunteers?filter=core", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/contact",
    fetcherTrigger
  );
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

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

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      await trigger({ body: dataForm, method: "POST" });

      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          Message from <strong>{dataForm.name}</strong> at{" "}
          <strong>{dataForm.email}</strong> has been recorded
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
                        disabled={isMutating}
                        fullWidth
                        label="Name"
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
                        disabled={isMutating}
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
                    name="to"
                    render={({ field }) => (
                      <FormControl fullWidth variant="standard">
                        <InputLabel id="to">To *</InputLabel>
                        <Select
                          {...field}
                          disabled={isMutating}
                          label="To *"
                          labelId="to"
                          required
                        >
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
                          {data.map(
                            ({ playaName, worldName }: IDataVolunteerItem) => (
                              <MenuItem
                                key={`${playaName}-${worldName}`}
                                value={`${playaName} "${worldName}"`}
                                sx={{ pl: 4 }}
                              >
                                {`${playaName} "${worldName}"`}
                              </MenuItem>
                            )
                          )}
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
                            disabled={isMutating}
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
                        disabled={isMutating}
                        fullWidth
                        label="Message"
                        multiline
                        required
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
                Send
              </Button>
            </CardActions>
          </form>
        </Card>
      </Container>
    </>
  );
};
