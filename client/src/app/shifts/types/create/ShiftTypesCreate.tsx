import {
  Close as CloseIcon,
  DateRange as DateRangeIcon,
  EventAvailable as EventAvailableIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import {
  defaultValues,
  IFormValues,
  processInformation,
  processPositionList,
  processTimeList,
  ShiftTypesForm,
} from "src/app/shifts/types/type/ShiftTypesForm";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type {
  IReqShiftTypeItem,
  IResShiftTypeDefaults,
} from "src/components/types/shifts/types";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

export const ShiftTypesCreate = () => {
  // fetching, mutation, and revalidation
  // --------------------
  const {
    data: dataDefaults,
    error: errorDefaults,
  }: {
    data: IResShiftTypeDefaults;
    error: Error | undefined;
  } = useSWR("/api/shifts/types/defaults", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/shifts/types",
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    clearErrors,
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    setError,
    setValue,
    watch,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const {
    append: timeAppend,
    fields: timeFields,
    remove: timeRemove,
  } = useFieldArray({
    control,
    name: "timeList",
  });
  const {
    append: positionAppend,
    fields: positionFields,
    remove: positionRemove,
  } = useFieldArray({
    control,
    name: "positionList",
  });
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  dayjs.extend(isSameOrAfter);
  dayjs.extend(isSameOrBefore);

  // logic
  // --------------------
  if (errorDefaults) return <ErrorPage />;
  if (!dataDefaults) return <Loading />;

  const handlePositionRemove = (index: number) => {
    positionRemove(index);
  };
  const handleTimeRemove = (index: number) => {
    timeRemove(index);
  };

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const information = processInformation(dataDefaults, formValues);
      const positionList = processPositionList(dataDefaults, formValues);
      const timeList = processTimeList(formValues);
      const body: IReqShiftTypeItem = {
        information,
        positionList,
        timeList,
      };

      // update database
      await trigger({
        body,
        method: "POST",
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            <strong>{formValues.information.name}</strong>
          </strong>{" "}
          type has been created
        </SnackbarText>,
        {
          variant: "success",
        }
      );

      // route to types page
      router.push("/shifts/types");
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
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Create shift type"
      />
      <Container component="main">
        <Box component="section">
          <Breadcrumbs>
            <Link href="/shifts/types">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <DateRangeIcon sx={{ mr: 0.5 }} />
                Shift types
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <EventAvailableIcon sx={{ mr: 0.5 }} />
              Create type
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box component="section">
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <ShiftTypesForm
              clearErrors={clearErrors}
              control={control}
              dataDefaults={dataDefaults}
              errors={errors}
              getValues={getValues}
              handlePositionRemove={handlePositionRemove}
              handleTimeRemove={handleTimeRemove}
              positionAppend={positionAppend}
              positionFields={positionFields}
              setError={setError}
              setValue={setValue}
              timeAppend={timeAppend}
              timeFields={timeFields}
              timeRemove={timeRemove}
              typeName={defaultValues.information.name}
              watch={watch}
            />

            {/* actions */}
            <Card>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  p: 2,
                }}
              >
                <Button
                  disabled={isMutating}
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    router.push("/shifts/types");
                  }}
                  type="button"
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  disabled={Object.keys(errors).length > 0 || isMutating}
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <EventAvailableIcon />
                    )
                  }
                  type="submit"
                  variant="contained"
                >
                  Create type
                </Button>
              </CardActions>
            </Card>
          </form>
        </Box>
      </Container>
    </>
  );
};
