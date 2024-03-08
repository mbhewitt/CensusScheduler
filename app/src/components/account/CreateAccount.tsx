import {
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useContext, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { ResetPasscodeForm } from "src/components/account/ResetPasscodeForm";
import { ErrorForm } from "src/components/general/ErrorForm";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type {
  IResVolunteerAccount,
  IVolunteerAccountFormValues,
} from "src/components/types";
import { SIGN_IN } from "src/constants";
import { SessionContext } from "src/state/session/context";

const defaultValues: IVolunteerAccountFormValues = {
  email: "",
  emergencyContact: "",
  location: "",
  passcodeConfirm: "",
  passcodeCreate: "",
  phone: "",
  playaName: "",
  worldName: "",
};
export const CreateAccount = () => {
  const { sessionDispatch } = useContext(SessionContext);
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [isPasscodeCreateVisible, setIsPasscodeCreateVisible] = useState(false);
  const [isPasscodeConfirmVisible, setIsPasscodeConfirmVisible] =
    useState(false);

  const onSubmit: SubmitHandler<IVolunteerAccountFormValues> = async (
    dataFormInitial
  ) => {
    // trim whitespace
    const dataFormFinal: IVolunteerAccountFormValues = Object.keys(
      dataFormInitial
    ).reduce((dataFormAcc, dataFormKey) => {
      return {
        ...dataFormAcc,
        [dataFormKey]:
          dataFormInitial[
            dataFormKey as keyof IVolunteerAccountFormValues
          ]?.trim(),
      };
    }, {});

    try {
      const { data: dataVolunteerItem }: { data: IResVolunteerAccount } =
        await axios.post("/api/account", {
          email: dataFormFinal.email,
          emergencyContact: dataFormFinal.emergencyContact,
          location: dataFormFinal.location,
          passcodeCreate: dataFormFinal.passcodeCreate,
          phone: dataFormFinal.phone,
          playaName: dataFormFinal.playaName,
          worldName: dataFormFinal.worldName,
        });

      sessionDispatch({
        payload: dataVolunteerItem,
        type: SIGN_IN,
      });
      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          Account for{" "}
          <strong>
            {dataVolunteerItem.playaName} &quot;{dataVolunteerItem.worldName}
            &quot;
          </strong>{" "}
          has been created
        </SnackbarText>,
        {
          variant: "success",
        }
      );
      router.push(`/account/${dataVolunteerItem.shiftboardId}`);
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
            alt="volunteers riding the census art car"
            fill
            priority
            src="/create-account/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Create account"
      />
      <Container component="main">
        <Box component="section">
          <Breadcrumbs>
            <Link href="/sign-in">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                  textDecoration: "underline",
                }}
              >
                <LoginIcon sx={{ mr: 0.5 }} />
                Sign in
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <PersonAddIcon sx={{ mr: 0.5 }} />
              Create account
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box component="section">
          <Card
            sx={{
              margin: "auto",
              width: theme.spacing(50),
            }}
          >
            <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
              <CardContent>
                {/* handle errors */}
                {Object.keys(errors).length > 0 && (
                  <ErrorForm errors={errors} />
                )}

                <Stack spacing={2}>
                  <Controller
                    control={control}
                    name="playaName"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        error={Object.hasOwn(errors, "playaName")}
                        fullWidth
                        helperText={errors.playaName?.message}
                        label="Playa / preferred name"
                        required
                        variant="standard"
                      />
                    )}
                    rules={{
                      required: "Playa / preferred name is required",
                      validate: (value) => {
                        return (
                          Boolean(value?.trim()) ||
                          "Playa / preferred name is required"
                        );
                      },
                    }}
                  />
                  <Controller
                    control={control}
                    name="worldName"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        error={Object.hasOwn(errors, "worldName")}
                        fullWidth
                        helperText={errors.worldName?.message}
                        label="Default world name"
                        required
                        variant="standard"
                      />
                    )}
                    rules={{
                      required: "Default world name is required",
                      validate: (value) => {
                        return (
                          Boolean(value?.trim()) ||
                          "Default world name is required"
                        );
                      },
                    }}
                  />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        error={Object.hasOwn(errors, "email")}
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
                        return (
                          Boolean(value?.trim()) || "Email name is required"
                        );
                      },
                    }}
                  />
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone"
                        type="tel"
                        variant="standard"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="location"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        helperText="How to find you on playa and any other relevant info"
                        label="Location"
                        variant="standard"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        helperText="How to reach your emergency contact on or off playa"
                        label="Emergency contact"
                        variant="standard"
                      />
                    )}
                  />
                  <ResetPasscodeForm
                    control={control}
                    errors={errors}
                    getValues={getValues}
                    isPasscodeConfirmVisible={isPasscodeConfirmVisible}
                    isPasscodeCreateVisible={isPasscodeCreateVisible}
                    setIsPasscodeConfirmVisible={setIsPasscodeConfirmVisible}
                    setIsPasscodeCreateVisible={setIsPasscodeCreateVisible}
                  />
                </Stack>
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
                  startIcon={<PersonAddIcon />}
                  type="submit"
                  variant="contained"
                >
                  Create account
                </Button>
              </CardActions>
            </form>
          </Card>
        </Box>
      </Container>
    </>
  );
};
