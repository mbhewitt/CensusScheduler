"use client";

import {
  Close as CloseIcon,
  EventAvailable as EventAvailableIcon,
  EventNote as EventNoteIcon,
} from "@mui/icons-material";
import {
  Box,
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

import { IFormValues } from "@/app/shifts/types/type";
import {
  defaultValues,
  processInformation,
  processTimeList,
  ShiftTypesForm,
} from "@/app/shifts/types/type/ShiftTypesForm";
import { BreadcrumbsNav } from "@/components/general/BreadcrumbsNav";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type {
  IReqShiftTypeItem,
  IResShiftTypeDefaults,
} from "@/components/types/shifts/types";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

export const ShiftTypesCreate = () => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
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
    replace: timeReplace,
  } = useFieldArray({
    control,
    name: "timeList",
  });
  const {
    fields: timePositionListAddFields,
    remove: timePositionListAddRemove,
    replace: timePositionListAddReplace,
  } = useFieldArray({
    control,
    name: "timeAdd.positionList",
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
  // ------------------------------------------------------------
  if (errorDefaults) return <ErrorPage />;
  if (!dataDefaults) return <Loading />;

  const handlePositionRemove = (index: number, name: string) => {
    positionRemove(index);
    timePositionListAddRemove(index);
    enqueueSnackbar(
      <SnackbarText>
        <strong>{name}</strong> position has been removed
      </SnackbarText>,
      {
        variant: "success",
      }
    );
  };
  const handleTimeRemove = (index: number, name: string) => {
    timeRemove(index);
    enqueueSnackbar(
      <SnackbarText>
        <strong>{name}</strong> time has been removed
      </SnackbarText>,
      {
        variant: "success",
      }
    );
  };

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const information = processInformation(dataDefaults, formValues);
      const timeList = processTimeList(formValues);
      const body: IReqShiftTypeItem = {
        information,
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
  // ------------------------------------------------------------
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
          <BreadcrumbsNav>
            <Link href="/shifts/types">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <EventNoteIcon sx={{ mr: 0.5 }} />
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
              Create shift type
            </Typography>
          </BreadcrumbsNav>
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
              timePositionListAddReplace={timePositionListAddReplace}
              timePositionListAddFields={timePositionListAddFields}
              timeRemove={timeRemove}
              timeReplace={timeReplace}
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
                  Create shift type
                </Button>
              </CardActions>
            </Card>
          </form>
        </Box>
      </Container>
    </>
  );
};
