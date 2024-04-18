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

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IResShiftItem,
  IResShiftPositionItem,
  IResShiftVolunteerItem,
  IResVolunteerDropdownItem,
  IResVolunteerShiftItem,
  IVolunteerOption,
  TCheckInTypes,
} from "src/components/types";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import {
  checkIsAuthenticated,
  checkIsCoreCrew,
} from "src/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { formatDateName, formatTime } from "src/utils/formatDateTime";
import { getCheckInType } from "src/utils/getCheckInType";

interface IFormValues {
  volunteer: null | IVolunteerOption;
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
  shiftPositionList: IResShiftPositionItem[];
  shiftTimesId: string | string[] | undefined;
  shiftVolunteerList: IResShiftVolunteerItem[];
  startTime: string;
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
  // context
  // --------------------
  const {
    developerModeState: {
      accountType,
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { playaName, roleList, shiftboardId, worldName },
    },
  } = useContext(SessionContext);

  // fetching, mutation, and revalidation
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });

  const volunteerWatch = watch("volunteer");
  const trainingTimesIdWatch = watch("trainingTimesId");
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

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // --------------------
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const volunteerSelected =
    volunteerWatch &&
    dataVolunteerList &&
    dataVolunteerList.find(
      (dataVolunteerItem: IResVolunteerDropdownItem) =>
        dataVolunteerItem.shiftboardId === volunteerWatch?.shiftboardId
    );
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
      const isVolunteerSlotAvailable = shiftVolunteerList.every((volunteer) => {
        return volunteer.shiftboardId !== Number(shiftboardId);
      });
      const isVolunteerShiftAvailable = dataVolunteerShiftList.every(
        (volunteerShiftItem: IResVolunteerShiftItem) => {
          return !dayjs(startTime).isBetween(
            dayjs(volunteerShiftItem.startTime),
            dayjs(volunteerShiftItem.endTime),
            null,
            "[]"
          );
        }
      );

      // if slot is available and shift causes time conflict
      // then display warning notification
      if (isVolunteerSlotAvailable && !isVolunteerShiftAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            Adding{" "}
            <strong>{`${formatDateName(date, dateName)}, ${formatTime(
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

  // logic
  // --------------------
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

  if (
    errorShiftList ||
    errorTrainingVolunteerList ||
    errorVolunteerList ||
    errorVolunteerShiftList
  ) {
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
  }
  if (!dataVolunteerList || !dataTrainingList) {
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
  }

  const isCoreCrew = checkIsCoreCrew(accountType, roleList);
  const shiftPositionIdWatch = watch("shiftPositionId");
  const prerequisiteIdWatch = shiftPositionList.find(
    (shiftPositionItem) =>
      shiftPositionItem.shiftPositionId === shiftPositionIdWatch
  )?.prerequisiteId;
  dayjs.extend(isBetween);

  // evaluate check-in type and available shifts and positions
  let volunteerListDisplay: IVolunteerOption[] = [];
  let shiftPositionListDisplay: JSX.Element[] = [];
  const trainingList = dataTrainingList.filter(
    ({ shiftCategoryId }: { shiftCategoryId: number }) =>
      shiftCategoryId === prerequisiteIdWatch
  );
  let trainingListDisplay: JSX.Element[] = [];
  let trainingPositionListDisplay: JSX.Element[] = [];
  let noShowShift: string;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      // evaluate check-in value
      noShowShift = "X";

      // display volunteer list
      if (isAuthenticated && isCoreCrew) {
        volunteerListDisplay = dataVolunteerList.map(
          ({
            playaName,
            shiftboardId,
            worldName,
          }: IResVolunteerDropdownItem) => ({
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
      shiftPositionListDisplay = shiftPositionList.map(
        ({
          filledSlots,
          positionName,
          roleRequiredId,
          shiftPositionId,
          totalSlots,
        }) => {
          const isShiftPositionAvailable =
            (isAuthenticated && isCoreCrew) ||
            (totalSlots - filledSlots > 0 &&
              (roleRequiredId === 0 ||
                volunteerSelected?.roleList?.some(
                  ({ roleId }: { roleId: number }) => roleId === roleRequiredId
                )));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${shiftPositionId}-position`}
              value={shiftPositionId}
            >
              {positionName}: {filledSlots} / {totalSlots}
            </MenuItem>
          );
        }
      );

      // display training list
      trainingListDisplay = trainingList.map(
        ({
          date,
          endTime,
          filledSlots,
          shiftName,
          shiftTimesId,
          startTime,
          totalSlots,
        }: IResShiftItem) => {
          const isShiftPositionAvailable =
            (isAuthenticated && isCoreCrew) ||
            (totalSlots - filledSlots > 0 &&
              dayjs(dateTimeValue).isBefore(dayjs(startTime)));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${shiftTimesId}-training`}
              value={shiftTimesId}
            >
              {`${formatDateName(date, null)}, ${formatTime(
                startTime,
                endTime
              )}, ${shiftName}: ${filledSlots} / ${totalSlots}`}
            </MenuItem>
          );
        }
      );

      // display training position list
      if (dataTrainingVolunteerList) {
        trainingPositionListDisplay =
          dataTrainingVolunteerList.shiftPositionList.map(
            ({
              filledSlots,
              positionName,
              roleRequiredId,
              shiftPositionId,
              totalSlots,
            }: IResShiftPositionItem) => {
              const isShiftPositionAvailable =
                (isAuthenticated && isCoreCrew) ||
                (totalSlots - filledSlots > 0 &&
                  (roleRequiredId === 0 ||
                    volunteerSelected?.roleList?.some(
                      ({ roleId }: { roleId: number }) =>
                        roleId === roleRequiredId
                    )));

              return (
                <MenuItem
                  disabled={!isShiftPositionAvailable}
                  key={`${shiftPositionId}-position`}
                  value={shiftPositionId}
                >
                  {positionName}: {filledSlots} / {totalSlots}
                </MenuItem>
              );
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
        ({
          playaName,
          shiftboardId,
          worldName,
        }: IResVolunteerDropdownItem) => ({
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
      trainingListDisplay = trainingList.map(
        ({
          date,
          endTime,
          filledSlots,
          shiftName,
          shiftTimesId,
          startTime,
          totalSlots,
        }: IResShiftItem) => {
          const isShiftPositionAvailable =
            (isAuthenticated && isCoreCrew) ||
            (totalSlots - filledSlots > 0 &&
              dayjs(dateTimeValue).isBefore(dayjs(startTime)));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${shiftTimesId}-training`}
              value={shiftTimesId}
            >
              {`${formatDateName(date, null)}, ${formatTime(
                startTime,
                endTime
              )}, ${shiftName}: ${filledSlots} / ${totalSlots}`}
            </MenuItem>
          );
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
            }: IResShiftPositionItem) => (
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
        (volunteerItem: IResVolunteerDropdownItem) =>
          volunteerItem.shiftboardId === dataForm.volunteer?.shiftboardId
      );
      const shiftPositionAdd = shiftPositionList.find(
        (shiftPositionItem) =>
          shiftPositionItem.shiftPositionId === dataForm.shiftPositionId
      );
      const trainingAdd = dataTrainingList.find(
        (trainingItem: IResShiftItem) =>
          trainingItem.shiftTimesId === dataForm.trainingTimesId
      );
      const trainingPositionAdd =
        dataTrainingVolunteerList?.shiftPositionList.find(
          (trainingPositionItem: IResShiftPositionItem) =>
            trainingPositionItem.shiftPositionId === dataForm.trainingPositionId
        );
      let noShowTraining: string | undefined;

      // evaluate the check-in type and value for training
      if (trainingAdd) {
        const checkInTypeTraining = getCheckInType({
          dateTime: dayjs(dateTimeValue),
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

      // display success notification
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

      reset({
        volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
        shiftPositionId: "",
        trainingPositionId: "",
        trainingTimesId: "",
      });

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
                  isOptionEqualToValue={(option, value: IVolunteerOption) =>
                    option.shiftboardId === value.shiftboardId
                  }
                  onChange={(_, data) => field.onChange(data)}
                  options={volunteerListDisplay}
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
                validate: (value) => {
                  if (value) {
                    const isVolunteerSlotAvailable = shiftVolunteerList.every(
                      (volunteer) =>
                        volunteer.shiftboardId !== value.shiftboardId
                    );

                    return (
                      isVolunteerSlotAvailable ||
                      `${value.label} has been added already`
                    );
                  }

                  return "";
                },
              }}
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
                    error={Boolean(errors.shiftPositionId)}
                    disabled={!volunteerWatch}
                    label="Shift position *"
                    labelId="shiftPositionId"
                    onChange={(event) => {
                      const shiftPositionSelected = event.target.value;
                      const shiftPositionFound = shiftPositionList.find(
                        (shiftPositionItem) =>
                          shiftPositionItem.shiftPositionId ===
                          shiftPositionSelected
                      );

                      // update field
                      field.onChange(shiftPositionSelected);

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
                  {errors.shiftPositionId && (
                    <FormHelperText error>
                      {errors.shiftPositionId?.message}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
              rules={{
                required: "Shift position is required",
              }}
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
                        error={Boolean(errors.trainingTimesId)}
                        label="Training time *"
                        labelId="trainingTimesId"
                        onChange={(event) => {
                          const trainingTimesIdSelected = event.target.value;
                          const trainingItemFound = dataTrainingList.find(
                            (dataTrainingItem: IResShiftItem) =>
                              dataTrainingItem.shiftTimesId ===
                              trainingTimesIdSelected
                          );
                          const isVolunteerTrainingAvailable =
                            dataVolunteerShiftList.every(
                              (
                                dataVolunteerShiftList: IResVolunteerShiftItem
                              ) =>
                                !dayjs(trainingItemFound.startTime).isBetween(
                                  dayjs(dataVolunteerShiftList.startTime),
                                  dayjs(dataVolunteerShiftList.endTime),
                                  null,
                                  "[]"
                                )
                            );

                          // update field
                          field.onChange(trainingTimesIdSelected);

                          // if volunteer shift causes time conflict
                          // then display warning notification
                          if (!isVolunteerTrainingAvailable) {
                            enqueueSnackbar(
                              <SnackbarText>
                                Adding{" "}
                                <strong>{`${formatDateName(
                                  trainingItemFound.date,
                                  trainingItemFound.dateName
                                )}, ${formatTime(
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
                      {errors.trainingTimesId && (
                        <FormHelperText error>
                          {errors.trainingTimesId?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                  rules={{
                    required: "Training time is required",
                  }}
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
                        disabled={!trainingTimesIdWatch}
                        error={Boolean(errors.trainingPositionId)}
                        label="Training position *"
                        labelId="trainingPositionId"
                        onChange={(event) => {
                          const trainingPositionSelected = event.target.value;
                          const trainingPositionFound =
                            dataTrainingVolunteerList.shiftPositionList.find(
                              (trainingPositionItem: IResShiftPositionItem) =>
                                trainingPositionItem.shiftPositionId ===
                                trainingPositionSelected
                            );

                          // update field
                          field.onChange(trainingPositionSelected);

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
                                  {trainingPositionFound.positionName}
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
                      {errors.trainingPositionId && (
                        <FormHelperText error>
                          {errors.trainingPositionId?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                  rules={{
                    required: "Training position is required",
                  }}
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
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
            }
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
            disabled={Object.keys(errors).length > 0 || isMutating}
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
