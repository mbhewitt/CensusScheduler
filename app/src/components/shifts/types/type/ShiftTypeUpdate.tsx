import {
  Close as CloseIcon,
  DateRange as DateRangeIcon,
  EditCalendar as EditCalendarIcon,
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
import { useEffect, useState } from "react";
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
} from "src/components/shifts/types/type/ShiftTypeForm";
import { ShiftTypePositionRemove } from "src/components/shifts/types/type/ShiftTypePositionRemove";
import { ShiftTypeTimeRemove } from "src/components/shifts/types/type/ShiftTypeTimeRemove";
import {
  IResShiftTypePositionItem,
  IResShiftTypeTimeItem,
} from "src/components/types";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

const defaultPositionState = {
  isOpen: false,
  position: {
    id: 0,
    index: 0,
    name: "",
  },
  type: {
    id: 0,
  },
};
const defaultTimeState = {
  isOpen: false,
  time: {
    dateTime: "",
    id: 0,
    index: 0,
  },
  type: {
    id: 0,
  },
};
export const ShiftTypeUpdate = () => {
  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);
  const [isPositionDialogRemoveOpen, setIsPositionDialogRemoveOpen] = useState(
    structuredClone(defaultPositionState)
  );
  const [isTimeDialogRemoveOpen, setIsTimeDialogRemoveOpen] = useState(
    structuredClone(defaultTimeState)
  );

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { shiftTypeId } = router.query;
  const { data: dataDefaults, error: errorDefaults } = useSWR(
    isMounted ? "/api/shifts/types/defaults" : null,
    fetcherGet
  );
  const { data: dataCurrent, error: errorCurrent } = useSWR(
    isMounted ? `/api/shifts/types/${shiftTypeId}` : null,
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/types/${shiftTypeId}`,
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
  const { enqueueSnackbar } = useSnackbar();
  dayjs.extend(isSameOrBefore);

  // side effects
  // --------------------
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);
  useEffect(() => {
    if (dataCurrent) {
      const { information, positionList, timeList } = dataCurrent;

      reset({
        information,
        positionList,
        timeList,
      });
    }
  }, [dataCurrent, reset]);

  // logic
  // --------------------
  if (errorDefaults || errorCurrent) return <ErrorPage />;
  if (!dataDefaults || !dataCurrent) return <Loading />;

  const handlePositionRemove = (
    index: number,
    name: string,
    positionId: number
  ) => {
    const positionFound = dataCurrent.positionList.find(
      (positionItem: IResShiftTypePositionItem) =>
        positionItem.positionId === positionId
    );

    if (shiftTypeId && positionFound) {
      setIsPositionDialogRemoveOpen({
        isOpen: true,
        position: {
          id: positionId,
          index,
          name,
        },
        type: {
          id: Number(shiftTypeId),
        },
      });
    } else {
      positionRemove(index);
    }
  };
  const handleTimeRemove = (
    dateTime: string,
    index: number,
    timeId: number
  ) => {
    const timeFound = dataCurrent.timeList.find(
      (timeItem: IResShiftTypeTimeItem) => timeItem.timeId === timeId
    );

    if (shiftTypeId && timeFound) {
      setIsTimeDialogRemoveOpen({
        isOpen: true,
        time: {
          dateTime,
          id: timeId,
          index,
        },
        type: {
          id: Number(shiftTypeId),
        },
      });
    } else {
      timeRemove(index);
    }
  };

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
        method: "PATCH",
      });

      // display success notification
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            <strong>{formValues.information.name}</strong>
          </strong>{" "}
          shift type has been updated
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
        text="Update shift type"
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
              <EditCalendarIcon sx={{ mr: 0.5 }} />
              Update type
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
              handlePositionRemove={handlePositionRemove}
              handleTimeRemove={handleTimeRemove}
              positionAppend={positionAppend}
              positionFields={positionFields}
              setError={setError}
              setValue={setValue}
              shiftTypeName={dataCurrent.information.name}
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
                      <EditCalendarIcon />
                    )
                  }
                  type="submit"
                  variant="contained"
                >
                  Update type
                </Button>
              </CardActions>
            </Card>
          </form>
        </Box>
      </Container>

      {/* position dialog remove */}
      <ShiftTypePositionRemove
        handlePositionDialogRemoveClose={() =>
          setIsPositionDialogRemoveOpen(structuredClone(defaultPositionState))
        }
        isPositionDialogRemoveOpen={isPositionDialogRemoveOpen.isOpen}
        positionItem={isPositionDialogRemoveOpen.position}
        positionRemove={positionRemove}
        typeItem={isPositionDialogRemoveOpen.type}
      />

      {/* time dialog remove */}
      <ShiftTypeTimeRemove
        handleTimeDialogRemoveClose={() =>
          setIsTimeDialogRemoveOpen(structuredClone(defaultTimeState))
        }
        isTimeDialogRemoveOpen={isTimeDialogRemoveOpen.isOpen}
        timeItem={isTimeDialogRemoveOpen.time}
        timeRemove={timeRemove}
        typeItem={isTimeDialogRemoveOpen.type}
      />
    </>
  );
};
