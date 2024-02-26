import {
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useContext, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type { IVolunteerItem } from "src/components/types";
import { SIGN_IN } from "src/constants";
import { SessionContext } from "src/state/session/context";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IVolunteer {
  label: string;
  shiftboardId: string;
}
interface IFormValues {
  volunteer: null | IVolunteer;
  passcode: string;
}

const defaultValues: IFormValues = {
  volunteer: null,
  passcode: "",
};
export const SignIn = () => {
  const { sessionDispatch } = useContext(SessionContext);
  const { data, error } = useSWR("/api/volunteers?filter=dropdown", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/sign-in",
    fetcherTrigger
  );
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const theme = useTheme();
  const [isPasscodeVisible, setIsPasscodeVisible] = useState(false);

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const dataVolunteerItem = await trigger({
        body: {
          passcode: dataForm.passcode,
          shiftboardId: dataForm.volunteer?.shiftboardId,
        },
        method: "POST",
      });

      // if response has a 404 status code
      // then display an error message
      if (dataVolunteerItem.statusCode === 404) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>Name / passcode combination is incorrect</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );

        // else load account page
      } else {
        sessionDispatch({
          payload: dataVolunteerItem,
          type: SIGN_IN,
        });
        reset(defaultValues);
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {dataVolunteerItem.playaName} &quot;{dataVolunteerItem.worldName}
              &quot;
            </strong>{" "}
            has signed in
          </SnackbarText>,
          {
            variant: "success",
          }
        );
      }
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
            alt="census volunteers greeting behind desks"
            fill
            priority
            src="/sign-in/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Sign in"
      />
      <Container component="main">
        <Card
          sx={{
            margin: "auto",
            width: theme.spacing(50),
          }}
        >
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Stack spacing={2}>
                <Controller
                  control={control}
                  name="volunteer"
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      fullWidth
                      isOptionEqualToValue={(option, value: IVolunteer) =>
                        option.shiftboardId === value.shiftboardId ||
                        value.shiftboardId === ""
                      }
                      onChange={(_, data) => field.onChange(data)}
                      options={data.map(
                        ({
                          playaName,
                          shiftboardId,
                          worldName,
                        }: IVolunteerItem) => ({
                          label: `${playaName} "${worldName}"`,
                          shiftboardId,
                        })
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Name"
                          required
                          variant="standard"
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.shiftboardId}>
                          {option.label}
                        </li>
                      )}
                    />
                  )}
                />
                <Stack alignItems="center" direction="row">
                  <Controller
                    control={control}
                    name="passcode"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        autoComplete="off"
                        disabled={isMutating}
                        fullWidth
                        label="Passcode"
                        required
                        type={isPasscodeVisible ? "text" : "password"}
                        variant="standard"
                      />
                    )}
                  />
                  <IconButton
                    onClick={() => setIsPasscodeVisible((prev) => !prev)}
                  >
                    {isPasscodeVisible ? (
                      <VisibilityOffIcon color="secondary" />
                    ) : (
                      <VisibilityIcon color="secondary" />
                    )}
                  </IconButton>
                </Stack>
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
                disabled={isMutating}
                onClick={() => {
                  router.push("/create-account");
                }}
                startIcon={
                  isMutating ? (
                    <CircularProgress size="1rem" />
                  ) : (
                    <PersonAddIcon />
                  )
                }
                type="button"
                variant="outlined"
              >
                Create account
              </Button>
              <Button
                disabled={isMutating}
                startIcon={
                  isMutating ? <CircularProgress size="1rem" /> : <LoginIcon />
                }
                type="submit"
                variant="contained"
              >
                Sign in
              </Button>
            </CardActions>
          </form>
        </Card>
      </Container>
    </>
  );
};
