import {
  HighlightOff as HighlightOffIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useSnackbar } from "notistack";
import { useContext, useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import io from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DialogHeader } from "src/components/general/DialogHeader";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IDataPositionItem,
  IDataShiftVolunteerItem,
  IDataTrainingItem,
  IDataVolunteerItem,
  IDataVolunteerShiftItem,
  TCheckInTypes,
} from "src/components/types";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkInGet } from "src/utils/checkInGet";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { positionItemFirstGet } from "src/utils/positionItemFirstGet";

interface IFormValues {
  volunteer: null | IVolunteer;
  shiftPositionId: string;
  trainingPositionId: string;
}
interface IShiftVolunteersDialogAddProps {
  checkInType: TCheckInTypes;
  date: string;
  dateName: string;
  endTime: string;
  handleDialogAddClose: () => void;
  isDialogAddOpen: boolean;
  positionList: IDataPositionItem[];
  shift: string;
  shiftId: string | string[] | undefined;
  shiftVolunteerList: IDataShiftVolunteerItem[];
  startTime: string;
}
interface IVolunteer {
  label: string;
  shiftboardId: string;
}

const socket = io();
const defaultValues: IFormValues = {
  volunteer: null,
  shiftPositionId: "",
  trainingPositionId: "",
};
export const ShiftVolunteersDialogAdd = ({
  checkInType,
  date,
  dateName,
  endTime,
  handleDialogAddClose,
  isDialogAddOpen,
  positionList,
  shift,
  shiftId,
  shiftVolunteerList,
  startTime,
}: IShiftVolunteersDialogAddProps) => {
  const {
    developerModeState: {
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { isCoreCrew, playaName, shiftboardId, worldName },
    },
  } = useContext(SessionContext);
  const { data: dataVolunteerList, error: errorVolunteerInfo } = useSWR(
    "/api/volunteers?filter=all",
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/shift-volunteers/${shiftId}`,
    fetcherTrigger
  );
  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues,
  });
  const volunteerWatch = watch("volunteer", null);
  const shiftPositionIdWatch = watch("shiftPositionId", "");
  const { data: dataVolunteerShiftList, error: errorVolunteerShiftList } =
    useSWR(
      volunteerWatch
        ? `/api/volunteer-shifts/${volunteerWatch?.shiftboardId}`
        : null,
      fetcherGet
    );
  const { data: dataTrainingList, error: errorTrainingList } = useSWR(
    shiftPositionIdWatch
      ? `/api/volunteer-shifts/${volunteerWatch?.shiftboardId}/trainings/${shiftPositionIdWatch}`
      : null,
    fetcherGet
  );
  const { enqueueSnackbar } = useSnackbar();
  dayjs.extend(isBetween);

  useEffect(() => {
    if (isAuthenticated) {
      const positionItemFirstDisplay = positionItemFirstGet(positionList);

      reset({
        volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
        shiftPositionId: positionItemFirstDisplay?.shiftPositionId ?? "",
      });
    }
  }, [
    isAuthenticated,
    playaName,
    positionList,
    reset,
    shiftboardId,
    worldName,
  ]);

  if (errorVolunteerInfo || errorVolunteerShiftList || errorTrainingList)
    return <ErrorAlert />;
  if (!dataVolunteerList) return <Loading />;

  // evaluate check-in type and available positions
  let volunteerListDisplay: IVolunteer[] = [];
  let positionListDisplay: JSX.Element[] = [];
  const trainingListDisplay: JSX.Element[] = [];
  let noShowShift: string;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      // evaluate check-in value
      noShowShift = "X";

      // display volunteer list
      if (isAuthenticated && isCoreCrew) {
        volunteerListDisplay = dataVolunteerList.dataVolunteerList.map(
          ({ playaName, shiftboardId, worldName }: IDataVolunteerItem) => ({
            label: `${playaName} "${worldName}"`,
            shiftboardId,
          })
        );
      } else if (isAuthenticated) {
        volunteerListDisplay = [
          {
            label: `${playaName} "${worldName}"`,
            shiftboardId,
          },
        ];
      } else {
        volunteerListDisplay = [];
      }

      const volunteerSelected =
        volunteerWatch &&
        dataVolunteerList.dataVolunteerList.find(
          (dataVolunteerItem: IDataVolunteerItem) =>
            dataVolunteerItem.shiftboardId === volunteerWatch?.shiftboardId
        );

      // display position list
      positionList.forEach(
        ({ freeSlots, position, role, shiftPositionId, totalSlots }) => {
          const isPositionAvailable =
            (isAuthenticated && isCoreCrew) ||
            (freeSlots > 0 &&
              (role === "" || volunteerSelected?.roleList?.includes(role)));

          positionListDisplay.push(
            <MenuItem
              disabled={!isPositionAvailable}
              key={`${shiftPositionId}-position`}
              value={shiftPositionId}
            >
              {position}: {totalSlots - freeSlots}/{totalSlots}
            </MenuItem>
          );
        }
      );

      // display training list
      let trainingItemIdFirst = "";
      if (dataTrainingList && dataTrainingList.length > 0) {
        dataTrainingList.forEach(
          ({
            date,
            dateName,
            freeSlots,
            position,
            shift,
            shiftPositionId,
            startTime,
            totalSlots,
          }: IDataTrainingItem) => {
            let isTrainingAvailable = false;

            if (isAuthenticated && isCoreCrew) {
              isTrainingAvailable = true;
              trainingItemIdFirst = dataTrainingList[0].shiftPositionId;
            } else {
              if (dateTimeValue.isAfter(dayjs(startTime))) return;
              isTrainingAvailable = freeSlots > 0;
              if (trainingItemIdFirst === "" && isTrainingAvailable) {
                trainingItemIdFirst = shiftPositionId;
              }
            }

            trainingListDisplay.push(
              <MenuItem
                disabled={!isTrainingAvailable}
                key={`${shiftPositionId}-training`}
                value={shiftPositionId}
              >
                {`${dateName} ${date} at ${shift} - ${position}: ${
                  totalSlots - freeSlots
                }/${totalSlots}`}
              </MenuItem>
            );
          }
        );

        setValue("trainingPositionId", trainingItemIdFirst);
      }

      break;
    }
    case SHIFT_DURING:
    case SHIFT_PAST: {
      // evaluate check-in value
      noShowShift = "";

      // display volunteer list
      volunteerListDisplay = dataVolunteerList.dataVolunteerList.map(
        ({ playaName, shiftboardId, worldName }: IDataVolunteerItem) => ({
          label: `${playaName} "${worldName}"`,
          shiftboardId,
        })
      );

      // display position list
      positionListDisplay = positionList.map(
        ({ freeSlots, position, shiftPositionId, totalSlots }) => (
          <MenuItem key={`${shiftPositionId}-position`} value={shiftPositionId}>
            {position}: {totalSlots - freeSlots}/{totalSlots}
          </MenuItem>
        )
      );

      // display training list
      let trainingItemIdFirst = "";
      if (dataTrainingList && dataTrainingList.length > 0) {
        dataTrainingList.forEach(
          ({
            date,
            dateName,
            freeSlots,
            position,
            shift,
            shiftPositionId,
            totalSlots,
          }: IDataTrainingItem) => {
            let isTrainingAvailable = false;

            if (isAuthenticated && isCoreCrew) {
              isTrainingAvailable = true;
              trainingItemIdFirst = dataTrainingList[0].shiftPositionId;
            } else {
              if (dateTimeValue.isAfter(dayjs(startTime))) return;
              isTrainingAvailable = freeSlots > 0;
              if (trainingItemIdFirst === "" && isTrainingAvailable) {
                trainingItemIdFirst = shiftPositionId;
              }
            }

            trainingListDisplay.push(
              <MenuItem
                disabled={!isTrainingAvailable}
                key={`${shiftPositionId}-training`}
                value={shiftPositionId}
              >
                {`${dateName} ${date} at ${shift} - ${position}: ${
                  totalSlots - freeSlots
                }/${totalSlots}`}
              </MenuItem>
            );
          }
        );

        setValue("trainingPositionId", trainingItemIdFirst);
      }
      break;
    }
    default: {
      throw new Error(`Unknown check-in type: ${checkInType}`);
    }
  }

  // handle form submission
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const volunteerAdd = dataVolunteerList.dataVolunteerList.find(
        (volunteerItem: IDataVolunteerItem) =>
          volunteerItem.shiftboardId === dataForm.volunteer?.shiftboardId
      );
      const positionAdd = positionList.find(
        (positionItem) =>
          positionItem.shiftPositionId === dataForm.shiftPositionId
      );
      const trainingAdd =
        dataTrainingList.find(
          (trainingItem: IDataTrainingItem) =>
            trainingItem.shiftPositionId === dataForm.trainingPositionId
        ) ?? undefined;
      let noShowTraining: string | undefined;
      let isVolunteerTrainingAvailable: boolean | undefined;

      // evaluate the check-in type and value for training
      if (trainingAdd) {
        const checkInTypeTraining = checkInGet({
          dateTime: dateTimeValue,
          endTime: dayjs(trainingAdd.endTime),
          startTime: dayjs(trainingAdd.startTime),
        });

        switch (checkInTypeTraining) {
          case SHIFT_FUTURE:
            noShowTraining = "X";
            break;
          case SHIFT_DURING:
          case SHIFT_PAST: {
            noShowTraining = "";
            break;
          }
          default: {
            throw new Error(`Unknown check-in type: ${checkInTypeTraining}`);
          }
        }
      }

      // check if the volunteer has been added already
      const isVolunteerSlotAvailable = !shiftVolunteerList.some(
        (volunteer) =>
          volunteer.shiftboardId === Number(dataForm.volunteer?.shiftboardId)
      );
      // check if there are any shift or training time conflicts
      const isVolunteerShiftAvailable =
        !dataVolunteerShiftList.volunteerShiftList.some(
          (volunteerShiftItem: IDataVolunteerShiftItem) =>
            dayjs(startTime).isBetween(
              dayjs(volunteerShiftItem.startTime),
              dayjs(volunteerShiftItem.endTime),
              null,
              "[]"
            )
        );
      if (trainingAdd) {
        isVolunteerTrainingAvailable =
          !dataVolunteerShiftList.volunteerShiftList.some(
            (volunteerShiftItem: IDataVolunteerShiftItem) =>
              dayjs(trainingAdd.startTime).isBetween(
                dayjs(volunteerShiftItem.startTime),
                dayjs(volunteerShiftItem.endTime),
                null,
                "[]"
              )
          );
      }

      // if the volunteer has been added already
      // then display an error
      if (!isVolunteerSlotAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {volunteerAdd.playaName} &quot;{volunteerAdd.worldName}
              &quot;
            </strong>{" "}
            has been added already
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }
      // if there's a shift time conflict and a volunteer is signed in
      // then display an error
      if (!isVolunteerShiftAvailable && isAuthenticated && !isCoreCrew) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>Shift time conflict</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }
      // if there's a training time conflict and a volunteer is signed in
      // then display an error
      if (
        isVolunteerTrainingAvailable === false &&
        isAuthenticated &&
        !isCoreCrew
      ) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>Training time conflict</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }
      // if there's a shift time conflict and an admin is signed in
      // then display a warning
      if (!isVolunteerShiftAvailable && isAuthenticated && isCoreCrew) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {volunteerAdd.playaName} &quot;{volunteerAdd.worldName}
              &quot;
            </strong>{" "}
            for <strong>{positionAdd?.position}</strong> has been added, but
            there&apos;s a <strong>shift time conflict</strong>
          </SnackbarText>,
          {
            variant: "warning",
          }
        );
      } else if (
        isVolunteerTrainingAvailable === false &&
        isAuthenticated &&
        isCoreCrew
      ) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {volunteerAdd.playaName} &quot;{volunteerAdd.worldName}
              &quot;
            </strong>{" "}
            for <strong>{positionAdd?.position}</strong> has been added, but
            there&apos;s a <strong>training time conflict</strong>
          </SnackbarText>,
          {
            variant: "warning",
          }
        );
        // else display a success
      } else {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {volunteerAdd.playaName} &quot;{volunteerAdd.worldName}&quot;
            </strong>{" "}
            for <strong>{positionAdd?.position}</strong> has been added
          </SnackbarText>,
          {
            variant: "success",
          }
        );
      }

      // add shift position
      if (
        (isVolunteerSlotAvailable && isVolunteerShiftAvailable) ||
        (!isVolunteerShiftAvailable && isAuthenticated && isCoreCrew)
      ) {
        // update database
        await trigger({
          body: {
            noShow: noShowShift,
            shiftboardId: dataForm.volunteer?.shiftboardId,
            shiftPositionId: dataForm.shiftPositionId,
          },
          method: "POST",
        });
        // emit shift update
        socket.emit("req-shift-volunteer-add", {
          date,
          dateName,
          endTime,
          noShow: noShowShift,
          playaName: volunteerAdd.playaName,
          position: positionAdd?.position,
          shift,
          shiftId,
          shiftboardId: dataForm.volunteer?.shiftboardId,
          shiftPositionId: dataForm.shiftPositionId,
          startTime,
          worldName: volunteerAdd.worldName,
        });

        // add training position
        if (trainingAdd) {
          // update database
          await trigger({
            body: {
              noShow: noShowTraining,
              shiftboardId: dataForm.volunteer?.shiftboardId,
              shiftPositionId: dataForm.trainingPositionId,
            },
            method: "POST",
          });
          // emit shift update
          socket.emit("req-shift-volunteer-add", {
            date: trainingAdd.date,
            dateName: trainingAdd.dateName,
            endTime: trainingAdd.endTime,
            noShow: noShowTraining,
            playaName: volunteerAdd.playaName,
            position: trainingAdd.position,
            shift: trainingAdd.shift,
            shiftboardId: dataForm.volunteer?.shiftboardId,
            shiftId: trainingAdd.shiftId,
            shiftPositionId: dataForm.trainingPositionId,
            startTime: trainingAdd.startTime,
            worldName: volunteerAdd.worldName,
          });
        }

        reset(defaultValues);
      }

      handleDialogAddClose();
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
    <Dialog
      fullWidth
      onClose={() => {
        handleDialogAddClose();

        if (isAuthenticated) {
          const positionItemFirstDisplay = positionItemFirstGet(positionList);

          reset({
            volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
            shiftPositionId: positionItemFirstDisplay?.shiftPositionId ?? "",
          });
        } else {
          reset(defaultValues);
        }
      }}
      open={isDialogAddOpen}
    >
      <DialogHeader
        handleDialogClose={() => {
          handleDialogAddClose();

          if (isAuthenticated) {
            const positionItemFirstDisplay = positionItemFirstGet(positionList);

            reset({
              volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
              shiftPositionId: positionItemFirstDisplay?.shiftPositionId ?? "",
            });
          } else {
            reset(defaultValues);
          }
        }}
        text="Add volunteer"
      />
      <DialogContent>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
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
                    options={volunteerListDisplay}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Name"
                        required
                        variant="standard"
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                control={control}
                name="shiftPositionId"
                render={({ field }) => (
                  <FormControl fullWidth variant="standard">
                    <InputLabel id="position">Position *</InputLabel>
                    <Select
                      {...field}
                      disabled={!volunteerWatch}
                      label="Position *"
                      labelId="position"
                      onChange={(event) => {
                        const positionSelected = event.target.value;

                        field.onChange(positionSelected);
                        positionList.forEach((positionItem) => {
                          // if there are less than or equal to zero slots available
                          // then display warning notification
                          if (
                            positionItem.shiftPositionId === positionSelected &&
                            positionItem.freeSlots <= 0
                          ) {
                            enqueueSnackbar(
                              <SnackbarText>
                                There are{" "}
                                <strong>{positionItem.freeSlots}</strong>{" "}
                                openings available for{" "}
                                <strong>{positionItem.position}</strong>
                              </SnackbarText>,
                              {
                                variant: "warning",
                              }
                            );
                          }
                        });
                      }}
                      required
                    >
                      {positionListDisplay}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            {dataTrainingList && dataTrainingList.length > 0 && (
              <Grid item xs={12}>
                <Controller
                  control={control}
                  name="trainingPositionId"
                  render={({ field }) => (
                    <FormControl
                      error={trainingListDisplay.length === 0}
                      fullWidth
                      variant="standard"
                    >
                      <InputLabel id="training">Training</InputLabel>
                      <Select
                        {...field}
                        disabled={trainingListDisplay.length === 0}
                        label="Training"
                        labelId="training"
                      >
                        {trainingListDisplay}
                      </Select>
                      {trainingListDisplay.length === 0 && (
                        <FormHelperText>
                          Please see a staff member
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography gutterBottom>Position Details:</Typography>
              {
                positionList.find(
                  (positionItem) =>
                    positionItem.shiftPositionId === shiftPositionIdWatch
                )?.details
              }
            </Grid>
          </Grid>
          <DialogActions>
            <Button
              disabled={isMutating}
              startIcon={<HighlightOffIcon />}
              onClick={() => {
                handleDialogAddClose();

                if (isAuthenticated) {
                  const positionItemFirstDisplay =
                    positionItemFirstGet(positionList);

                  reset({
                    volunteer: {
                      label: `${playaName} "${worldName}"`,
                      shiftboardId,
                    },
                    shiftPositionId:
                      positionItemFirstDisplay?.shiftPositionId ?? "",
                  });
                } else {
                  reset(defaultValues);
                }
              }}
              type="button"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              disabled={isMutating}
              startIcon={
                isMutating ? <CircularProgress size="sm" /> : <PersonAddIcon />
              }
              type="submit"
              variant="contained"
            >
              Add
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};
