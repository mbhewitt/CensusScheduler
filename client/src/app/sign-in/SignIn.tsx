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
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type { IVolunteerOption } from "@/components/types";
import { IReqSignIn } from "@/components/types/sign-in";
import type { IResVolunteerDefaultItem } from "@/components/types/volunteers";
import { SESSION_SIGN_IN } from "@/constants";
import { SessionContext } from "@/state/session/context";
import { ensure } from "@/utils/ensure";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { resetFilterList } from "@/utils/resetFilterList";

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
  // ------------------------------------------------------------
  const { sessionDispatch } = useContext(SessionContext);

  // state
  // ------------------------------------------------------------
  const [isPasscodeVisible, setIsPasscodeVisible] = useState(false);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
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
  const theme = useTheme();

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // form submission
  // ------------------------------------------------------------
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

        resetFilterList();

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
  // ------------------------------------------------------------
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
