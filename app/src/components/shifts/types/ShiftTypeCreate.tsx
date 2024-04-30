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
} from "@mui/material";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import {
  defaultValues,
  findCategoryId,
  IFormValues,
  processPositionList,
  processTimeList,
  ShiftTypeForm,
} from "src/components/shifts/types/ShiftTypeForm";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

export const ShiftTypeCreate = () => {
  // fetching, mutation, and revalidation
  // --------------------
  const { data: dataDefaults, error: errorDefaults } = useSWR(
    "/api/shifts/types/defaults",
    fetcherGet
  );
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
    reset,
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
  dayjs.extend(isSameOrBefore);

  // logic
  // --------------------
  if (errorDefaults) return <ErrorPage />;
  if (!dataDefaults) return <Loading />;

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const categoryId = findCategoryId(dataDefaults, formValues);
      const positionList = processPositionList(dataDefaults, formValues);
      const timeList = processTimeList(formValues);

      // update database
      await trigger({
        body: {
          information: {
            categoryId,
            details: formValues.information.details,
            isCore: formValues.information.isCore,
            isOffPlaya: formValues.information.isOffPlaya,
            name: formValues.information.name,
          },
          positionList,
          timeList,
        },
        method: "POST",
      });

      // display success notification
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            <strong>{formValues.information.name}</strong>
          </strong>{" "}
          shift type has been created
        </SnackbarText>,
        {
          variant: "success",
        }
      );

      // route to shift types page
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
        Image={
          <Image
            alt="volunteers riding the census art car"
            fill
            priority
            src="/volunteers/account/create/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
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
            <ShiftTypeForm
              clearErrors={clearErrors}
              control={control}
              dataDefaults={dataDefaults}
              errors={errors}
              getValues={getValues}
              positionAppend={positionAppend}
              positionFields={positionFields}
              positionRemove={positionRemove}
              setError={setError}
              setValue={setValue}
              timeAppend={timeAppend}
              timeFields={timeFields}
              timeRemove={timeRemove}
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
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <CloseIcon />
                    )
                  }
                  onClick={() => {
                    reset(defaultValues);
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
