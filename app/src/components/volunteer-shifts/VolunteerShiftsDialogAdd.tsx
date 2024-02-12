import {
  EventAvailable as EventAvailableIcon,
  HighlightOff as HighlightOffIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import { useContext } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import io from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IDataPositionItem,
  IDataShiftPositionListItem,
  IDataTrainingItem,
  IDataVolunteerShiftItem,
} from "src/components/types";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkInGet } from "src/utils/checkInGet";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  shiftId: string;
  shiftPositionId: string;
  trainingPositionId: string;
}

interface IVolunteerShiftsDialogAddProps {
  handleDialogAddClose: () => void;
  isDialogAddOpen: boolean;
  playaName: string;
  shiftboardId: string | string[] | undefined;
  worldName: string;
}

const socket = io();
const defaultValues: IFormValues = {
  shiftId: "",
  shiftPositionId: "",
  trainingPositionId: "",
};
export const VolunteerShiftsDialogAdd = ({
  handleDialogAddClose,
  isDialogAddOpen,
  playaName,
  shiftboardId,
  worldName,
}: IVolunteerShiftsDialogAddProps) => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { isCoreCrew },
    },
  } = useContext(SessionContext);
  const {
    developerModeState: {
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);
  const { data: dataVolunteerInfo, error: errorVolunteerInfo } = useSWR(
    `/api/volunteers/${shiftboardId}`,
    fetcherGet
  );
  const { data: dataVolunteerShiftList, error: errorVolunteerShiftList } =
    useSWR(`/api/volunteer-shifts/${shiftboardId}`, fetcherGet);
  const { data: dataShiftList, error: errorShiftList } = useSWR(
    "/api/shifts?filter=positions",
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteer-shifts/${shiftboardId}`,
    fetcherTrigger
  );
  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues,
  });
  const shiftIdWatch = watch("shiftId", "");
  const shiftPositionIdWatch = watch("shiftPositionId", "");
  const { data: dataTrainingList, error: errorTrainingList } = useSWR(
    shiftPositionIdWatch
      ? `/api/volunteer-shifts/${shiftboardId}/trainings/${shiftPositionIdWatch}`
      : null,
    fetcherGet
  );
  const { enqueueSnackbar } = useSnackbar();

  if (
    errorVolunteerInfo ||
    errorVolunteerShiftList ||
    errorShiftList ||
    errorTrainingList
  )
    return (
      <DialogContainer
        handleDialogClose={() => {
          handleDialogAddClose();
          reset(defaultValues);
        }}
        isDialogOpen={isDialogAddOpen}
        text="Add volunteer shift"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!dataVolunteerInfo || !dataVolunteerShiftList || !dataShiftList)
    return (
      <DialogContainer
        handleDialogClose={() => {
          handleDialogAddClose();
          reset(defaultValues);
        }}
        isDialogOpen={isDialogAddOpen}
        text="Add volunteer shift"
      >
        <Loading />
      </DialogContainer>
    );

  // update position list based on selected shift
  const dataShiftSelected = dataShiftList.shiftList.find(
    (dataShiftItem: IDataShiftPositionListItem) =>
      dataShiftItem.shiftId === shiftIdWatch
  );

  // update position list based on selected position
  const trainingListDisplay: JSX.Element[] = [];
  let trainingItemIdFirst = "";

  if (dataTrainingList && dataTrainingList.length > 0) {
    dataTrainingList.forEach(
      ({
        date,
        dateName,
        endTime,
        freeSlots,
        position,
        shift,
        shiftPositionId,
        startTime,
        totalSlots,
      }: IDataTrainingItem) => {
        // evaluate the check-in type and available trainings
        const checkInType = checkInGet({
          dateTime: dateTimeValue,
          endTime: dayjs(endTime),
          startTime: dayjs(startTime),
        });
        let isTrainingAvailable = false;

        switch (checkInType) {
          case SHIFT_FUTURE:
            isTrainingAvailable =
              (isAuthenticated && isCoreCrew) || freeSlots > 0;

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

            if (!trainingItemIdFirst) trainingItemIdFirst = shiftPositionId;
            break;
          case SHIFT_DURING:
            trainingListDisplay.push(
              <MenuItem
                disabled={false}
                key={`${shiftPositionId}-training`}
                value={shiftPositionId}
              >
                {`${dateName} ${date} at ${shift} - ${position}: ${
                  totalSlots - freeSlots
                }/${totalSlots}`}
              </MenuItem>
            );

            if (!trainingItemIdFirst) trainingItemIdFirst = shiftPositionId;
            break;
          case SHIFT_PAST: {
            if (isAuthenticated && isCoreCrew) {
              trainingListDisplay.push(
                <MenuItem
                  disabled={false}
                  key={`${shiftPositionId}-training`}
                  value={shiftPositionId}
                >
                  {`${dateName} ${date} at ${shift} - ${position}: ${
                    totalSlots - freeSlots
                  }/${totalSlots}`}
                </MenuItem>
              );

              if (!trainingItemIdFirst) trainingItemIdFirst = shiftPositionId;
            }

            break;
          }
          default: {
            throw new Error(`Unknown check-in type: ${checkInType}`);
          }
        }
      }
    );

    setValue("trainingPositionId", trainingItemIdFirst);
  }

  // handle form submission
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const shiftAdd = dataShiftList.shiftList.find(
        (shiftItem: IDataShiftPositionListItem) =>
          shiftItem.shiftId === dataForm.shiftId
      );
      const positionAdd = shiftAdd.positionList.find(
        (positionItem: IDataPositionItem) =>
          positionItem.shiftPositionId === dataForm.shiftPositionId
      );
      const trainingAdd = dataTrainingList.find(
        (trainingItem: IDataTrainingItem) =>
          trainingItem.shiftPositionId === dataForm.trainingPositionId
      );
      let noShowShift: string;
      let noShowTraining: string | undefined;
      let isTrainingVolunteerAvailable: boolean | undefined;

      // evaluate the check-in type and value for shift and training
      const checkInTypeShift = checkInGet({
        dateTime: dateTimeValue,
        endTime: dayjs(shiftAdd.endTime),
        startTime: dayjs(shiftAdd.startTime),
      });

      switch (checkInTypeShift) {
        case SHIFT_FUTURE:
          noShowShift = "X";
          break;
        case SHIFT_DURING:
        case SHIFT_PAST: {
          noShowShift = "";
          break;
        }
        default: {
          throw new Error(`Unknown check-in type: ${checkInTypeShift}`);
        }
      }

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

      // check if the shift has been added already
      const isShiftSlotAvailable =
        !dataVolunteerShiftList.volunteerShiftList.some(
          (shift: IDataVolunteerShiftItem) => shift.shiftId === shiftAdd.shiftId
        );
      // check if there are any shift or training time conflicts
      const isShiftVolunteerAvailable =
        !dataVolunteerShiftList.volunteerShiftList.some(
          (volunteerShiftItem: IDataVolunteerShiftItem) =>
            dayjs(shiftAdd.startTime).isBetween(
              dayjs(volunteerShiftItem.startTime),
              dayjs(volunteerShiftItem.endTime),
              null,
              "[]"
            )
        );
      if (trainingAdd) {
        isTrainingVolunteerAvailable =
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

      // if shift has been added already, display an error
      if (!isShiftSlotAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {shiftAdd.dateName} {shiftAdd.date} at {shiftAdd.shift}
            </strong>{" "}
            shift has been added already
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }
      // if there's a shift time conflict and a volunteer is signed in, display an error
      if (!isShiftVolunteerAvailable && isAuthenticated && !isCoreCrew) {
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
      // if there's a training time conflict and a volunteer is signed in, display an error
      if (
        isTrainingVolunteerAvailable === false &&
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
      // if there's a shift time conflict and an admin is signed in, display a warning
      if (!isShiftVolunteerAvailable && isAuthenticated && isCoreCrew) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {playaName} &quot;{worldName}
              &quot;
            </strong>{" "}
            for <strong>{positionAdd?.position}</strong> has been added, but
            there&apos;s a <strong>time conflict</strong>
          </SnackbarText>,
          {
            variant: "warning",
          }
        );
      } else if (
        isTrainingVolunteerAvailable === false &&
        isAuthenticated &&
        isCoreCrew
      ) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {playaName} &quot;{worldName}
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
              {shiftAdd.dateName} {shiftAdd.date}
            </strong>{" "}
            at <strong>{shiftAdd.shift}</strong> for{" "}
            <strong>{positionAdd.position}</strong> has been added
          </SnackbarText>,
          {
            variant: "success",
          }
        );
      }

      if (
        (isShiftSlotAvailable && isShiftVolunteerAvailable) ||
        (!isShiftVolunteerAvailable && isAuthenticated && isCoreCrew)
      ) {
        // update database
        await trigger({
          body: {
            noShow: noShowShift,
            shiftboardId,
            shiftPositionId: dataForm.shiftPositionId,
          },
          method: "POST",
        });
        // emit shift update
        socket.emit("req-shift-volunteer-add", {
          date: shiftAdd.date,
          dateName: shiftAdd.date,
          endTime: shiftAdd.endTime,
          noShow: noShowShift,
          playaName,
          position: positionAdd?.position,
          shift: shiftAdd.shift,
          shiftboardId,
          shiftId: shiftAdd.shiftId,
          shiftPositionId: dataForm.shiftPositionId,
          startTime: shiftAdd.startTime,
          worldName,
        });

        // add training position
        if (trainingAdd) {
          // update database
          await trigger({
            body: {
              noShow: noShowTraining,
              shiftboardId,
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
            playaName,
            position: trainingAdd.position,
            shift: trainingAdd.shift,
            shiftboardId,
            shiftId: trainingAdd.shiftId,
            shiftPositionId: dataForm.trainingPositionId,
            startTime: trainingAdd.startTime,
            worldName,
          });
        }

        reset(defaultValues);
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
    <DialogContainer
      handleDialogClose={() => {
        handleDialogAddClose();
        reset(defaultValues);
      }}
      isDialogOpen={isDialogAddOpen}
      text="Add volunteer shift"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Controller
              control={control}
              name="shiftId"
              render={({ field }) => (
                <FormControl fullWidth variant="standard">
                  <InputLabel id="shiftId">Shift date and time *</InputLabel>
                  <Select
                    {...field}
                    label="Shift date and time *"
                    labelId="shiftId"
                    onChange={(event) => {
                      const shiftId = event.target.value;
                      const dataShiftSelected = dataShiftList.shiftList.find(
                        (dataShiftItem: IDataShiftPositionListItem) =>
                          dataShiftItem.shiftId === shiftId
                      );
                      const positionItemFirst =
                        dataShiftSelected.positionList.find(
                          ({ freeSlots }: { freeSlots: number }) =>
                            freeSlots > 0
                        ) || dataShiftSelected.positionList[0];

                      field.onChange(shiftId);
                      setValue(
                        "shiftPositionId",
                        positionItemFirst.shiftPositionId
                      );

                      // if there are less than or equal to zero slots available, display warning notification
                      if (positionItemFirst.freeSlots <= 0) {
                        enqueueSnackbar(
                          <SnackbarText>
                            There are{" "}
                            <strong>{positionItemFirst.freeSlots}</strong>{" "}
                            openings available for{" "}
                            <strong>{positionItemFirst.position}</strong>
                          </SnackbarText>,
                          {
                            variant: "warning",
                          }
                        );
                      }
                    }}
                    required
                  >
                    {dataShiftList.shiftList.map(
                      ({
                        date,
                        dateName,
                        endTime,
                        freeSlots,
                        positionList,
                        shift,
                        shiftId,
                        shortName,
                        startTime,
                        totalSlots,
                      }: IDataShiftPositionListItem) => {
                        // evaluate the check-in type and available positions
                        const checkInType = checkInGet({
                          dateTime: dateTimeValue,
                          endTime: dayjs(endTime),
                          startTime: dayjs(startTime),
                        });
                        let isShiftAvailable = false;

                        switch (checkInType) {
                          case SHIFT_FUTURE:
                            if (isAuthenticated && isCoreCrew) {
                              isShiftAvailable = true;
                            } else if (isAuthenticated) {
                              isShiftAvailable = positionList.some(
                                ({ freeSlots, role }) =>
                                  freeSlots > 0 &&
                                  (role === "" ||
                                    dataVolunteerInfo.volunteerItem.roleList.includes(
                                      role
                                    ))
                              );
                            }
                            break;
                          case SHIFT_DURING: {
                            isShiftAvailable = true;
                            break;
                          }
                          case SHIFT_PAST: {
                            if (isAuthenticated && isCoreCrew) {
                              isShiftAvailable = true;
                            } else if (isAuthenticated) {
                              return null;
                            }
                            break;
                          }
                          default: {
                            throw new Error(
                              `Unknown check-in type: ${checkInType}`
                            );
                          }
                        }

                        return (
                          <MenuItem
                            disabled={!isShiftAvailable}
                            key={`${shiftId}`}
                            value={shiftId}
                          >
                            {`${dateName} ${date} at ${shift} - ${shortName}: ${
                              totalSlots - freeSlots
                            }/${totalSlots}`}
                          </MenuItem>
                        );
                      }
                    )}
                  </Select>
                </FormControl>
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
                    disabled={shiftIdWatch === ""}
                    label="Position *"
                    labelId="position"
                    onChange={(event) => {
                      const positionSelected = event.target.value;

                      field.onChange(positionSelected);
                      if (dataShiftSelected) {
                        dataShiftSelected.positionList.forEach(
                          (positionItem: IDataPositionItem) => {
                            // if there are less than or equal to zero slots available, display warning notification
                            if (
                              positionItem.shiftPositionId ===
                                positionSelected &&
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
                          }
                        );
                      }
                    }}
                    required
                  >
                    {dataShiftSelected &&
                      dataShiftSelected.positionList.map(
                        ({
                          freeSlots,
                          position,
                          role,
                          shiftPositionId,
                          totalSlots,
                        }: IDataPositionItem) => {
                          // evaluate the check-in type and available positions
                          const checkInType = checkInGet({
                            dateTime: dateTimeValue,
                            endTime: dayjs(dataShiftSelected.endTime),
                            startTime: dayjs(dataShiftSelected.startTime),
                          });
                          let isPositionAvailable = false;

                          switch (checkInType) {
                            case SHIFT_FUTURE:
                              isPositionAvailable =
                                (isAuthenticated && isCoreCrew) ||
                                (freeSlots > 0 &&
                                  (role === "" ||
                                    dataVolunteerInfo.volunteerItem.roleList.includes(
                                      role
                                    )));
                              break;
                            case SHIFT_DURING: {
                              isPositionAvailable = true;
                              break;
                            }
                            case SHIFT_PAST: {
                              isPositionAvailable =
                                isAuthenticated && isCoreCrew;
                              break;
                            }
                            default: {
                              throw new Error(
                                `Unknown check-in type: ${checkInType}`
                              );
                            }
                          }

                          return (
                            <MenuItem
                              disabled={!isPositionAvailable}
                              key={`${shiftPositionId}`}
                              value={shiftPositionId}
                            >
                              {position}: {totalSlots - freeSlots}/{totalSlots}
                            </MenuItem>
                          );
                        }
                      )}
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
                      <FormHelperText>Please see a staff member</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          )}
          {dataShiftSelected && (
            <Grid item xs={12}>
              <Typography gutterBottom>Position Details:</Typography>
              {
                dataShiftSelected.positionList.find(
                  (positionItem: IDataPositionItem) =>
                    positionItem.shiftPositionId === shiftPositionIdWatch
                )?.details
              }
            </Grid>
          )}
        </Grid>
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={<HighlightOffIcon />}
            onClick={() => {
              handleDialogAddClose();
              reset(defaultValues);
            }}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isMutating}
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
            Add
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
