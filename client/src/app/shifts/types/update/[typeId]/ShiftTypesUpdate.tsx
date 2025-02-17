"use client";

import {
  Close as CloseIcon,
  DateRange as DateRangeIcon,
  EditCalendar as EditCalendarIcon,
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
import { useEffect, useState } from "react";
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
import { ShiftTypesPositionDialogRemove } from "@/app/shifts/types/type/ShiftTypesPositionDialogRemove";
import { ShiftTypesTimeDialogRemove } from "@/app/shifts/types/type/ShiftTypesTimeDialogRemove";
import { BreadcrumbsNav } from "@/components/general/BreadcrumbsNav";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import {
  IReqShiftTypeItem,
  IResShiftTypeCurrent,
  IResShiftTypeDefaults,
  IResShiftTypeTimeItem,
} from "@/components/types/shifts/types";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

enum DialogList {
  PositionRemove,
  TimeRemove,
}
interface IShiftTypesUpdateProps {
  typeId: string;
}

export const ShiftTypesUpdate = ({ typeId }: IShiftTypesUpdateProps) => {
  // state
  // --------------------
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
  const {
    data: dataDefaults,
    error: errorDefaults,
  }: {
    data: IResShiftTypeDefaults;
    error: Error | undefined;
  } = useSWR("/api/shifts/types/defaults", fetcherGet);
  const {
    data: dataCurrent,
    error: errorCurrent,
  }: {
    data: IResShiftTypeCurrent;
    error: Error | undefined;
  } = useSWR(`/api/shifts/types/${typeId}`, fetcherGet);
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
    append: positionAppend,
    fields: positionFields,
    remove: positionRemove,
  } = useFieldArray({
    control,
    name: "positionList",
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
    replace: timePositionListAddReplace,
  } = useFieldArray({
    control,
    name: "timeAdd.positionList",
  });
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  dayjs.extend(isSameOrAfter);
  dayjs.extend(isSameOrBefore);

  // side effects
  // --------------------
  useEffect(() => {
    if (dataCurrent) {
      const { information, positionList, timeList } = dataCurrent;
      const timeListNew: IResShiftTypeTimeItem[] = timeList.map((timeItem) => {
        return {
          ...timeItem,
          endTime: timeItem.endTime,
          date: timeItem.startTime.split(" ")[0],
          startTime: timeItem.startTime,
        };
      });
      const timePositionListAddNew = positionList.map(
        ({ name, positionId }) => {
          return {
            alias: name,
            name,
            positionId,
            sapPoints: 1,
            slots: 1,
          };
        }
      );

      reset({
        information,
        positionAdd: defaultValues.positionAdd,
        positionList,
        timeAdd: {
          ...defaultValues.timeAdd,
          positionList: timePositionListAddNew,
        },
        timeList: timeListNew,
      });
    }
  }, [dataCurrent, reset]);

  // logic
  // --------------------
  if (errorDefaults || errorCurrent) return <ErrorPage />;
  if (!dataDefaults || !dataCurrent) return <Loading />;

  const handlePositionExistRemove = (index: number, positionId: number) => {
    const timeFieldsNew = structuredClone(timeFields);
    const timePositionListAddNew = timePositionListAddFields.filter(
      (timePositionListAddItem) =>
        timePositionListAddItem.positionId !== positionId
    );

    for (let i = 0; i < timeFieldsNew.length; i += 1) {
      timeFieldsNew[i].positionList = timeFieldsNew[i].positionList.filter(
        (positionItem) => positionItem.positionId !== positionId
      );
    }

    positionRemove(index);
    timeReplace(timeFieldsNew);
    timePositionListAddReplace(timePositionListAddNew);
  };
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
      handlePositionExistRemove(index, positionId);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> position has been removed
        </SnackbarText>,
        {
          variant: "success",
        }
      );
    }
  };
  const handleTimeExistRemove = (index: number, timeId: number) => {
    const timeFieldsNew = timeFields.filter(
      (timeItem) => timeItem.timeId !== timeId
    );

    timeRemove(index);
    timeReplace(timeFieldsNew);
  };
  const handleTimeRemove = (index: number, name: string, timeId: number) => {
    const timeFound = dataCurrent.timeList.find(
      (timeItem) => timeItem.timeId === timeId
    );

    if (typeId && timeFound) {
      setDialogActive({
        dialogItem: DialogList.TimeRemove,
        item: {
          id: timeId,
          index,
          name,
        },
      });
      setIsDialogOpen(true);
    } else {
      handleTimeExistRemove(index, timeId);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> time has been removed
        </SnackbarText>,
        {
          variant: "success",
        }
      );
    }
  };

  // form submission
  // --------------------
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
        text="Update shift type"
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
              timePositionListAddFields={timePositionListAddFields}
              timePositionListAddReplace={timePositionListAddReplace}
              timeRemove={timeRemove}
              timeReplace={timeReplace}
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
      <ShiftTypesPositionDialogRemove
        handleDialogClose={() => setIsDialogOpen(false)}
        handlePositionExistRemove={handlePositionExistRemove}
        isDialogOpen={
          dialogActive.dialogItem === DialogList.PositionRemove && isDialogOpen
        }
        positionItem={dialogActive.item}
        typeId={Number(typeId)}
      />

      {/* time dialog remove */}
      <ShiftTypesTimeDialogRemove
        handleDialogClose={() => setIsDialogOpen(false)}
        handleTimeExistRemove={handleTimeExistRemove}
        isDialogOpen={
          dialogActive.dialogItem === DialogList.TimeRemove && isDialogOpen
        }
        timeItem={dialogActive.item}
        typeId={Number(typeId)}
      />
    </>
  );
};
