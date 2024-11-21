import {
  Login as LoginIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
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
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type { IVolunteerOption } from "src/components/types";
import { IReqSignIn } from "src/components/types/sign-in";
import type { IResVolunteerDefaultItem } from "src/components/types/volunteers";
import { SESSION_SIGN_IN } from "src/constants";
import { SessionContext } from "src/state/session/context";
import { ensure } from "src/utils/ensure";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  volunteer: null | IVolunteerOption;
  passcode: string;
}

const defaultValues: IFormValues = {
  volunteer: null,
  passcode: "",
};
export const SignIn = () => {
  // context
  // --------------------
  const { sessionDispatch } = useContext(SessionContext);

  // state
  // --------------------
  const [isPasscodeVisible, setIsPasscodeVisible] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResVolunteerDefaultItem[];
    error: Error | undefined;
  } = useSWR("/api/volunteers/dropdown", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/sign-in",
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  // side effects
  // --------------------
  useEffect(() => {
    const notAuthorizedParam = searchParams?.get("notAuthorized");

    if (notAuthorizedParam) {
      enqueueSnackbar(
        <SnackbarText>You are not authorized to view this page</SnackbarText>,
        {
          variant: "error",
        }
      );
    }
  }, [enqueueSnackbar, searchParams]);

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqSignIn = {
        passcode: formValues.passcode,
        shiftboardId: ensure(formValues.volunteer?.shiftboardId),
      };

      // check database
      const dataVolunteerItem = await trigger({
        body,
        method: "POST",
      });

      // if response has 404 status code
      // then display error
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
          type: SESSION_SIGN_IN,
        });

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

  // render
  // --------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/desk-group.jpg)",
          backgroundSize: "cover",
        }}
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
                      isOptionEqualToValue={(option, value: IVolunteerOption) =>
                        option.shiftboardId === value.shiftboardId
                      }
                      onChange={(_event, value) => field.onChange(value)}
                      options={data.map(
                        ({ playaName, shiftboardId, worldName }) => ({
                          label: `${playaName} "${worldName}"`,
                          shiftboardId,
                        })
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          error={Boolean(errors.volunteer)}
                          helperText={errors.volunteer?.message}
                          label="Volunteer"
                          required
                          variant="standard"
                        />
                      )}
                    />
                  )}
                  rules={{
                    required: "Volunteer is required",
                  }}
                />
                <Stack alignItems="center" direction="row">
                  <Controller
                    control={control}
                    name="passcode"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        error={Boolean(errors.passcode)}
                        helperText={errors.passcode?.message}
                        fullWidth
                        label="Passcode"
                        required
                        type={isPasscodeVisible ? "text" : "password"}
                        variant="standard"
                      />
                    )}
                    rules={{
                      required: "Passcode is required",
                    }}
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
                  router.push("/volunteers/account/create");
                }}
                startIcon={<PersonAddAlt1Icon />}
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
