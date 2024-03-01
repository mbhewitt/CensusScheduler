import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  CircularProgress,
  DialogActions,
  FormControl,
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

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IPositionItem,
  IShiftItem,
  IShiftVolunteerItem,
  IVolunteerItem,
  IVolunteerShiftItem,
  TCheckInTypes,
} from "src/components/types";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkInGet } from "src/utils/checkInGet";
import { dateNameFormat, timeFormat } from "src/utils/dateTimeFormat";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  volunteer: null | IVolunteer;
  shiftPositionId: number | "";
  trainingPositionId: number | "";
  trainingTimesId: number | "";
}
interface IShiftVolunteersDialogAddProps {
  checkInType: TCheckInTypes;
  date: string;
  dateName: string;
  endTime: string;
  handleDialogAddClose: () => void;
  isDialogAddOpen: boolean;
  shiftName: string;
  shiftPositionList: IPositionItem[];
  shiftTimesId: string | string[] | undefined;
  shiftVolunteerList: IShiftVolunteerItem[];
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
  trainingTimesId: "",
};
export const ShiftVolunteersDialogAdd = ({
  checkInType,
  date,
  dateName,
  endTime,
  handleDialogAddClose,
  isDialogAddOpen,
  shiftName,
  shiftPositionList,
  shiftTimesId,
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
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues,
  });
  const volunteerWatch = watch("volunteer", null);
  const shiftPositionIdWatch = watch("shiftPositionId", 0);
  const prerequisiteIdWatch = shiftPositionList.find(
    (shiftPositionItem) =>
      shiftPositionItem.shiftPositionId === shiftPositionIdWatch
  )?.prerequisiteId;
  const trainingTimesIdWatch = watch("trainingTimesId", 0);
  const { data: dataVolunteerList, error: errorVolunteerList } = useSWR(
    "/api/volunteers/dropdown",
    fetcherGet
  );
  const { data: dataTrainingList, error: errorShiftList } = useSWR(
    "/api/shifts?filter=trainings",
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/shift-volunteers/${shiftTimesId}`,
    fetcherTrigger
  );
  const { data: dataVolunteerShiftList, error: errorVolunteerShiftList } =
    useSWR(
      volunteerWatch
        ? `/api/volunteer-shifts/${volunteerWatch?.shiftboardId}`
        : null,
      fetcherGet
    );
  const { data: dataTrainingVolunteerList, error: errorTrainingVolunteerList } =
    useSWR(
      trainingTimesIdWatch
        ? `/api/shift-volunteers/${trainingTimesIdWatch}`
        : null,
      fetcherGet
    );
  const { enqueueSnackbar } = useSnackbar();
  dayjs.extend(isBetween);

  const volunteerSelected =
    volunteerWatch &&
    dataVolunteerList &&
    dataVolunteerList.find(
      (dataVolunteerItem: IVolunteerItem) =>
        dataVolunteerItem.shiftboardId === volunteerWatch?.shiftboardId
    );
  const handleFormReset = () => {
    if (isAuthenticated) {
      reset({
        volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
        shiftPositionId: "",
        trainingPositionId: "",
        trainingTimesId: "",
      });
    } else {
      reset(defaultValues);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      reset({
        volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
        shiftPositionId: "",
        trainingPositionId: "",
        trainingTimesId: "",
      });
    }
  }, [isAuthenticated, playaName, reset, shiftboardId, worldName]);

  useEffect(() => {
    if (dataVolunteerShiftList) {
      const isVolunteerSlotAvailable = !shiftVolunteerList.some(
        (volunteer) => volunteer.shiftboardId === Number(shiftboardId)
      );
      const isVolunteerShiftAvailable = !dataVolunteerShiftList.some(
        (volunteerShiftItem: IVolunteerShiftItem) =>
          dayjs(startTime).isBetween(
            dayjs(volunteerShiftItem.startTime),
            dayjs(volunteerShiftItem.endTime),
            null,
            "[]"
          )
      );

      // if a slot is available there is a shift time conflict
      // then display warning notification
      if (isVolunteerSlotAvailable && !isVolunteerShiftAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            Adding{" "}
            <strong>{`${dateNameFormat(date, dateName)}, ${timeFormat(
              startTime,
              endTime
            )}, ${shiftName}`}</strong>{" "}
            shift will cause a time conflict for{" "}
            <strong>
              {volunteerSelected.playaName} &quot;{volunteerSelected.worldName}
              &quot;
            </strong>
          </SnackbarText>,
          {
            variant: "warning",
          }
        );
      }
    }
  }, [
    dataVolunteerShiftList,
    date,
    dateName,
    endTime,
    enqueueSnackbar,
    shiftboardId,
    shiftName,
    shiftVolunteerList,
    startTime,
    volunteerSelected,
  ]);

  if (
    errorShiftList ||
    errorTrainingVolunteerList ||
    errorVolunteerList ||
    errorVolunteerShiftList
  )
    return (
      <DialogContainer
        handleDialogClose={() => {
          handleDialogAddClose();
          handleFormReset();
        }}
        isDialogOpen={isDialogAddOpen}
        text="Add volunteer"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!dataVolunteerList || !dataTrainingList)
    return (
      <DialogContainer
        handleDialogClose={() => {
          handleDialogAddClose();
          handleFormReset();
        }}
        isDialogOpen={isDialogAddOpen}
        text="Add volunteer"
      >
        <Loading />
      </DialogContainer>
    );

  // evaluate check-in type and available shifts and positions
  let volunteerListDisplay: IVolunteer[] = [];
  let shiftPositionListDisplay: JSX.Element[] = [];
  const trainingList = dataTrainingList.filter(
    ({ shiftCategoryId }: { shiftCategoryId: number }) =>
      shiftCategoryId === prerequisiteIdWatch
  );
  const trainingListDisplay: JSX.Element[] = [];
  let trainingPositionListDisplay: JSX.Element[] = [];
  let noShowShift: string;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      // evaluate check-in value
      noShowShift = "X";

      // display volunteer list
      if (isAuthenticated && isCoreCrew) {
        volunteerListDisplay = dataVolunteerList.map(
          ({ playaName, shiftboardId, worldName }: IVolunteerItem) => ({
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
      }

      // display shift position list
      shiftPositionList.forEach(
        ({
          filledSlots,
          positionName,
          roleRequiredId,
          shiftPositionId,
          totalSlots,
        }) => {
          if (
            (isAuthenticated && isCoreCrew) ||
            (totalSlots - filledSlots > 0 &&
              (roleRequiredId === 0 ||
                volunteerSelected?.roleList?.some(
                  ({ roleId }: { roleId: number }) => roleId === roleRequiredId
                )))
          ) {
            shiftPositionListDisplay.push(
              <MenuItem
                key={`${shiftPositionId}-position`}
                value={shiftPositionId}
              >
                {positionName}: {filledSlots} / {totalSlots}
              </MenuItem>
            );
          }
        }
      );

      // display training list
      trainingList.forEach(
        ({
          date,
          endTime,
          filledSlots,
          shiftName,
          shiftTimesId,
          startTime,
          totalSlots,
        }: IShiftItem) => {
          if (
            (isAuthenticated && isCoreCrew) ||
            (totalSlots - filledSlots > 0 &&
              dateTimeValue.isBefore(dayjs(startTime)))
          ) {
            trainingListDisplay.push(
              <MenuItem key={`${shiftTimesId}-training`} value={shiftTimesId}>
                {`${date}, ${startTime} - ${endTime}, ${shiftName}: ${filledSlots} / ${totalSlots}`}
              </MenuItem>
            );
          }
        }
      );

      // display training position list
      if (dataTrainingVolunteerList) {
        dataTrainingVolunteerList.shiftPositionList.forEach(
          ({
            filledSlots,
            positionName,
            roleRequiredId,
            shiftPositionId,
            totalSlots,
          }: IPositionItem) => {
            if (
              (isAuthenticated && isCoreCrew) ||
              (totalSlots - filledSlots > 0 &&
                (roleRequiredId === 0 ||
                  volunteerSelected?.roleList?.some(
                    ({ roleId }: { roleId: number }) =>
                      roleId === roleRequiredId
                  )))
            ) {
              dataTrainingVolunteerList.push(
                <MenuItem
                  key={`${shiftPositionId}-position`}
                  value={shiftPositionId}
                >
                  {positionName}: {filledSlots} / {totalSlots}
                </MenuItem>
              );
            }
          }
        );
      }

      break;
    }
    case SHIFT_DURING:
    case SHIFT_PAST: {
      // evaluate check-in value
      noShowShift = "";

      // display volunteer list
      volunteerListDisplay = dataVolunteerList.map(
        ({ playaName, shiftboardId, worldName }: IVolunteerItem) => ({
          label: `${playaName} "${worldName}"`,
          shiftboardId,
        })
      );

      // display shift position list
      shiftPositionListDisplay = shiftPositionList.map(
        ({ filledSlots, positionName, shiftPositionId, totalSlots }) => (
          <MenuItem key={`${shiftPositionId}-position`} value={shiftPositionId}>
            {positionName}: {filledSlots} / {totalSlots}
          </MenuItem>
        )
      );

      // display training list
      trainingList.forEach(
        ({
          date,
          endTime,
          filledSlots,
          shiftName,
          shiftTimesId,
          startTime,
          totalSlots,
        }: IShiftItem) => {
          if (
            (isAuthenticated && isCoreCrew) ||
            (totalSlots - filledSlots > 0 &&
              dateTimeValue.isBefore(dayjs(startTime)))
          ) {
            trainingListDisplay.push(
              <MenuItem key={`${shiftTimesId}-training`} value={shiftTimesId}>
                {`${dateNameFormat(date, null)}, ${timeFormat(
                  startTime,
                  endTime
                )}, ${shiftName}: ${filledSlots} / ${totalSlots}`}
              </MenuItem>
            );
          }
        }
      );

      // display training position list
      if (dataTrainingVolunteerList) {
        trainingPositionListDisplay =
          dataTrainingVolunteerList.shiftPositionList.map(
            ({
              filledSlots,
              positionName,
              shiftPositionId,
              totalSlots,
            }: IPositionItem) => (
              <MenuItem
                key={`${shiftPositionId}-position`}
                value={shiftPositionId}
              >
                {positionName}: {filledSlots} / {totalSlots}
              </MenuItem>
            )
          );
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
      const volunteerAdd = dataVolunteerList.find(
        (volunteerItem: IVolunteerItem) =>
          volunteerItem.shiftboardId === dataForm.volunteer?.shiftboardId
      );
      const shiftPositionAdd = shiftPositionList.find(
        (shiftPositionItem) =>
          shiftPositionItem.shiftPositionId === dataForm.shiftPositionId
      );
      const trainingAdd = dataTrainingList.find(
        (trainingItem: IShiftItem) =>
          trainingItem.shiftTimesId === dataForm.trainingTimesId
      );
      const trainingPositionAdd =
        dataTrainingVolunteerList.shiftPositionList.find(
          (trainingPositionItem: IPositionItem) =>
            trainingPositionItem.shiftPositionId === dataForm.trainingPositionId
        );
      let noShowTraining: string | undefined;

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
      // else display a success notification
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {volunteerAdd.playaName} &quot;{volunteerAdd.worldName}&quot;
          </strong>{" "}
          for <strong>{shiftPositionAdd?.positionName}</strong> has been added
        </SnackbarText>,
        {
          variant: "success",
        }
      );

      // add shift position
      if (isVolunteerSlotAvailable || (isAuthenticated && isCoreCrew)) {
        // update database
        await trigger({
          body: {
            noShow: noShowShift,
            shiftboardId: dataForm.volunteer?.shiftboardId,
            shiftPositionId: dataForm.shiftPositionId,
            shiftTimesId,
          },
          method: "POST",
        });
        // emit shift update
        socket.emit("req-shift-volunteer-add", {
          noShow: noShowShift,
          playaName: volunteerAdd.playaName,
          positionName: shiftPositionAdd?.positionName,
          shiftboardId: dataForm.volunteer?.shiftboardId,
          shiftPositionId: dataForm.shiftPositionId,
          shiftTimesId,
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
              shiftTimesId: dataForm.trainingTimesId,
            },
            method: "POST",
          });
          // emit shift update
          socket.emit("req-shift-volunteer-add", {
            noShow: noShowTraining,
            playaName: volunteerAdd.playaName,
            positionName: trainingPositionAdd.positionName,
            shiftboardId: dataForm.volunteer?.shiftboardId,
            shiftPositionId: dataForm.trainingPositionId,
            shiftTimesId: dataForm.trainingTimesId,
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
    <DialogContainer
      handleDialogClose={() => {
        handleDialogAddClose();
        handleFormReset();
      }}
      isDialogOpen={isDialogAddOpen}
      text="Add volunteer"
    >
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
                  <InputLabel id="shiftPositionId">Shift position *</InputLabel>
                  <Select
                    {...field}
                    disabled={!volunteerWatch}
                    label="Shift position *"
                    labelId="shiftPositionId"
                    onChange={(event) => {
                      const shiftPositionSelected = event.target.value;

                      field.onChange(shiftPositionSelected);

                      const shiftPositionFound = shiftPositionList.find(
                        (shiftPositionItem) =>
                          shiftPositionItem.shiftPositionId ===
                          shiftPositionSelected
                      );

                      // if there are less than or equal to zero slots available
                      // then display warning notification
                      if (
                        shiftPositionFound &&
                        shiftPositionFound.filledSlots >=
                          shiftPositionFound.totalSlots
                      ) {
                        enqueueSnackbar(
                          <SnackbarText>
                            There are{" "}
                            <strong>
                              {shiftPositionFound.totalSlots -
                                shiftPositionFound.filledSlots}
                            </strong>{" "}
                            openings available for{" "}
                            <strong>{shiftPositionFound.positionName}</strong>
                          </SnackbarText>,
                          {
                            variant: "warning",
                          }
                        );
                      }
                    }}
                    required
                  >
                    {shiftPositionListDisplay}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          {trainingListDisplay.length > 0 && (
            <>
              <Grid item xs={6}>
                <Controller
                  control={control}
                  name="trainingTimesId"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="trainingTimesId">
                        Training time *
                      </InputLabel>
                      <Select
                        {...field}
                        label="Training time *"
                        labelId="trainingTimesId"
                        onChange={(event) => {
                          const trainingTimesIdSelected = event.target.value;

                          field.onChange(trainingTimesIdSelected);

                          const trainingItemFound = dataTrainingList.find(
                            (dataTrainingItem: IShiftItem) =>
                              dataTrainingItem.shiftTimesId ===
                              trainingTimesIdSelected
                          );
                          const isVolunteerTrainingAvailable =
                            !dataVolunteerShiftList.some(
                              (dataVolunteerShiftList: IVolunteerShiftItem) =>
                                dayjs(trainingItemFound.startTime).isBetween(
                                  dayjs(dataVolunteerShiftList.startTime),
                                  dayjs(dataVolunteerShiftList.endTime),
                                  null,
                                  "[]"
                                )
                            );

                          // if there is a shift time conflict
                          // then display warning notification
                          if (!isVolunteerTrainingAvailable) {
                            enqueueSnackbar(
                              <SnackbarText>
                                Adding{" "}
                                <strong>{`${dateNameFormat(
                                  trainingItemFound.date,
                                  trainingItemFound.dateName
                                )}, ${timeFormat(
                                  trainingItemFound.startTime,
                                  trainingItemFound.endTime
                                )}, ${
                                  trainingItemFound.shiftName
                                }`}</strong>{" "}
                                shift will cause a time conflict for{" "}
                                <strong>
                                  {volunteerSelected.playaName} &quot;
                                  {volunteerSelected.worldName}
                                  &quot;
                                </strong>
                              </SnackbarText>,
                              {
                                variant: "warning",
                              }
                            );
                          }
                        }}
                        required
                      >
                        {trainingListDisplay}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  control={control}
                  name="trainingPositionId"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="trainingPositionId">
                        Training position *
                      </InputLabel>
                      <Select
                        {...field}
                        label="Training position *"
                        labelId="trainingPositionId"
                        onChange={(event) => {
                          const trainingPositionSelected = event.target.value;

                          field.onChange(trainingPositionSelected);

                          const trainingPositionFound =
                            dataTrainingVolunteerList.shiftPositionList.find(
                              (trainingPositionItem: IPositionItem) =>
                                trainingPositionItem.shiftPositionId ===
                                trainingPositionSelected
                            );

                          // if there are less than or equal to zero slots available
                          // then display warning notification
                          if (
                            trainingPositionFound &&
                            trainingPositionFound.filledSlots >=
                              trainingPositionFound.totalSlots
                          ) {
                            enqueueSnackbar(
                              <SnackbarText>
                                There are{" "}
                                <strong>
                                  {trainingPositionFound.totalSlots -
                                    trainingPositionFound.filledSlots}
                                </strong>{" "}
                                openings available for{" "}
                                <strong>
                                  {trainingPositionFound.position}
                                </strong>
                              </SnackbarText>,
                              {
                                variant: "warning",
                              }
                            );
                          }
                        }}
                        required
                      >
                        {trainingPositionListDisplay}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </>
          )}
          {shiftPositionIdWatch && (
            <Grid item xs={12}>
              <Typography gutterBottom>Position Details:</Typography>
              {shiftPositionList.find(
                (shiftPositionItem) =>
                  shiftPositionItem.shiftPositionId === shiftPositionIdWatch
              )?.positionDetails ?? "Not available."}
            </Grid>
          )}
        </Grid>
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={<CloseIcon />}
            onClick={() => {
              handleDialogAddClose();
              handleFormReset();
            }}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <PersonAddIcon />
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
