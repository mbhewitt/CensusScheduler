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
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
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
  ShiftTypesForm,
} from "src/components/shifts/types/type/ShiftTypesForm";
import { ShiftTypesPositionRemove } from "src/components/shifts/types/type/ShiftTypesPositionRemove";
import { ShiftTypesTimeRemove } from "src/components/shifts/types/type/ShiftTypesTimeRemove";
import {
  IReqShiftTypeItem,
  IResShiftTypeCurrent,
  IResShiftTypeDefaults,
  IResShiftTypeTimeItem,
} from "src/components/types/shifts/types";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { dateTimezone } from "src/utils/formatDateTime";

enum DialogList {
  PositionRemove,
  TimeRemove,
}

export const ShiftTypesUpdate = () => {
  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);
  const [dialogActive, setDialogActive] = useState({
    dialogItem: 0,
    item: {
      id: 0,
      index: 0,
      name: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { typeId } = router.query;
  const {
    data: dataDefaults,
    error: errorDefaults,
  }: {
    data: IResShiftTypeDefaults;
    error: Error | undefined;
  } = useSWR(isMounted ? "/api/shifts/types/defaults" : null, fetcherGet);
  const {
    data: dataCurrent,
    error: errorCurrent,
  }: {
    data: IResShiftTypeCurrent;
    error: Error | undefined;
  } = useSWR(isMounted ? `/api/shifts/types/${typeId}` : null, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/types/${typeId}`,
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
  const theme = useTheme();
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
      const timeListNew: IResShiftTypeTimeItem[] = timeList.map((timeItem) => {
        return {
          ...timeItem,
          endTime: dateTimezone(timeItem.endTime).toISOString(),
          startDateTime: dateTimezone(timeItem.startDateTime).toISOString(),
        };
      });

      reset({
        information,
        positionList,
        timeList: timeListNew,
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
      (positionItem) => positionItem.positionId === positionId
    );

    if (typeId && positionFound) {
      setDialogActive({
        dialogItem: DialogList.PositionRemove,
        item: {
          id: positionId,
          index,
          name,
        },
      });
      setIsDialogOpen(true);
    } else {
      positionRemove(index);
    }
  };
  const handleTimeRemove = (index: number, name: string, id: number) => {
    const timeFound = dataCurrent.timeList.find(
      (timeItem) => timeItem.timeId === id
    );

    if (typeId && timeFound) {
      setDialogActive({
        dialogItem: DialogList.TimeRemove,
        item: {
          id,
          index,
          name,
        },
      });
      setIsDialogOpen(true);
    } else {
      timeRemove(index);
    }
  };

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const categoryIdFound = findCategoryId(dataDefaults, formValues);
      const positionList = processPositionList(dataDefaults, formValues);
      const timeList = processTimeList(formValues);
      const body: IReqShiftTypeItem = {
        information: {
          category: {
            id: categoryIdFound,
          },
          details: formValues.information.details,
          isCore: formValues.information.isCore,
          isOffPlaya: formValues.information.isOffPlaya,
          name: formValues.information.name,
        },
        positionList,
        timeList,
      };

      // update database
      await trigger({
        body,
        method: "PATCH",
      });

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

      // route to types page
      // router.push("/shifts/types");
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
              typeName={dataCurrent.information.name}
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
      <ShiftTypesPositionRemove
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogActive.dialogItem === DialogList.PositionRemove && isDialogOpen
        }
        positionItem={dialogActive.item}
        positionRemove={positionRemove}
        typeId={Number(typeId)}
      />

      {/* time dialog remove */}
      <ShiftTypesTimeRemove
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogActive.dialogItem === DialogList.TimeRemove && isDialogOpen
        }
        timeItem={dialogActive.item}
        timeRemove={timeRemove}
        typeId={Number(typeId)}
      />
    </>
  );
};
