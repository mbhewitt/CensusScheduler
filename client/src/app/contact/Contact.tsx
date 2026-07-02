"use client";

import { Send as SendIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useContext, useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type { IReqContact } from "@/components/types/contact";
import { CONTACT_RECIPIENT } from "@/constants";
import { SessionContext } from "@/state/session/context";
import { fetcherTrigger } from "@/utils/fetcher";

interface IFormValues {
  email: string;
  message: string;
  name: string;
  to: string;
}

const defaultValues: IFormValues = {
  email: "",
  message: "",
  name: "",
  to: CONTACT_RECIPIENT,
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
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated) {
      reset({
        ...defaultValues,
        email,
        name: `${playaName} "${worldName}"`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqContact = formValues;

      // update database
      await trigger({ body, method: "POST" });

      if (isAuthenticated) {
        reset({
          ...defaultValues,
          email,
          name: `${playaName} "${worldName}"`,
        });
      } else {
        reset(defaultValues);
      }
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
          backgroundImage: "url(/banners/peers-headwash-2.jpg)",
          backgroundSize: "cover",
        }}
        text="Contact"
      />
      <Container component="main">
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Off-playa contact form
          </Typography>
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
                        <TextField
                          {...field}
                          fullWidth
                          InputProps={{ readOnly: true }}
                          label="To"
                          variant="standard"
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
        </Box>
      </Container>
    </>
  );
};
