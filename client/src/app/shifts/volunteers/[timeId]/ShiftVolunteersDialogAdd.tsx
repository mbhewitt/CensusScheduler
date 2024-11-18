import {
  Close as CloseIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  CircularProgress,
  DialogActions,
  FormControl,
  FormHelperText,
  Grid2 as Grid,
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
import { io } from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type { IVolunteerOption, TCheckInTypes } from "src/components/types";
import type {
  IReqShiftVolunteerItem,
  IResShiftPositionCountItem,
  IResShiftRowItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "src/components/types/shifts";
import type {
  IResVolunteerDefaultItem,
  IResVolunteerShiftItem,
} from "src/components/types/volunteers";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAdmin, checkIsAuthenticated } from "src/utils/checkIsRoleExist";
import { ensure } from "src/utils/ensure";
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
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shiftVolunteersItem: {
    dateName: string;
    endTime: string;
    positionList: IResShiftPositionCountItem[];
    startTime: string;
    type: string;
    volunteerList: IResShiftVolunteerRowItem[];
  };
  timeId: string | string[] | undefined;
}

const socket = io();
const defaultValues: IFormValues = {
  shiftPositionId: "",
  trainingPositionId: "",
  trainingTimesId: "",
  volunteer: null,
};
export const ShiftVolunteersDialogAdd = ({
  checkInType,
  handleDialogClose,
  isDialogOpen,
  shiftVolunteersItem: {
    dateName,
    endTime,
    positionList,
    startTime,
    type,
    volunteerList,
  },
  timeId,
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
  const {
    data: dataVolunteerList,
    error: errorVolunteerList,
  }: {
    data: IResVolunteerDefaultItem[];
    error: Error | undefined;
  } = useSWR("/api/volunteers/dropdown", fetcherGet);
  const {
    data: dataTrainingList,
    error: errorShiftList,
  }: {
    data: IResShiftRowItem[];
    error: Error | undefined;
  } = useSWR("/api/shifts?filter=trainings", fetcherGet);
  const {
    data: dataVolunteerShiftList,
    error: errorVolunteerShiftList,
  }: {
    data: IResVolunteerShiftItem[];
    error: Error | undefined;
  } = useSWR(
    volunteerWatch
      ? `/api/volunteers/shifts/${volunteerWatch?.shiftboardId}`
      : null,
    fetcherGet
  );
  const {
    data: dataTrainingVolunteerDetails,
    error: errorTrainingVolunteerDetails,
  }: {
    data: IResShiftVolunteerInformation;
    error: Error | undefined;
  } = useSWR(
    trainingTimesIdWatch
      ? `/api/shifts/volunteers/${trainingTimesIdWatch}`
      : null,
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/volunteers/${timeId}`,
    fetcherTrigger
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
      (dataVolunteerItem) =>
        dataVolunteerItem.shiftboardId === volunteerWatch.shiftboardId
    );
  useEffect(() => {
    if (isAuthenticated && isDialogOpen) {
      reset({
        volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
        shiftPositionId: "",
        trainingPositionId: "",
        trainingTimesId: "",
      });
    } else if (isDialogOpen) {
      reset({
        volunteer: null,
        shiftPositionId: "",
        trainingPositionId: "",
        trainingTimesId: "",
      });
    }
  }, [
    isAuthenticated,
    isDialogOpen,
    playaName,
    reset,
    shiftboardId,
    worldName,
  ]);

  useEffect(() => {
    if (dataVolunteerShiftList) {
      const isVolunteerSlotAvailable = volunteerList.every((volunteer) => {
        return volunteer.shiftboardId !== Number(shiftboardId);
      });
      const isVolunteerShiftAvailable = dataVolunteerShiftList.every(
        (volunteerShiftItem) => {
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
            <strong>{`${formatDateName(startTime, dateName)}, ${formatTime(
              startTime,
              endTime
            )}, ${type}`}</strong>{" "}
            shift will cause a time conflict for{" "}
            <strong>
              {volunteerSelected?.playaName} &quot;
              {volunteerSelected?.worldName}
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
    dateName,
    endTime,
    enqueueSnackbar,
    shiftboardId,
    type,
    startTime,
    volunteerList,
    volunteerSelected,
  ]);

  // logic
  // --------------------
  if (
    errorShiftList ||
    errorTrainingVolunteerDetails ||
    errorVolunteerList ||
    errorVolunteerShiftList
  ) {
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Add volunteer"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  }
  if (!dataVolunteerList || !dataTrainingList) {
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Add volunteer"
      >
        <Loading />
      </DialogContainer>
    );
  }

  const isAdmin = checkIsAdmin(accountType, roleList);
  const shiftPositionIdWatch = watch("shiftPositionId");
  const prerequisiteIdWatch = positionList.find(
    (shiftPositionItem) =>
      shiftPositionItem.shiftPositionId === shiftPositionIdWatch
  )?.prerequisiteId;
  dayjs.extend(isBetween);

  // evaluate check-in type and available shifts and positions
  let volunteerListDisplay: IVolunteerOption[] = [];
  let positionListDisplay: JSX.Element[] = [];
  const trainingList = dataTrainingList.filter(
    ({ category: { id: categoryId } }) => categoryId === prerequisiteIdWatch
  );
  let trainingListDisplay: JSX.Element[] = [];
  let trainingPositionListDisplay: JSX.Element[] = [];
  let noShowShift: string;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      // evaluate check-in value
      noShowShift = "X";

      // display volunteer list
      if (isAuthenticated && isAdmin) {
        volunteerListDisplay = dataVolunteerList.map(
          ({ playaName, shiftboardId, worldName }) => ({
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
      positionListDisplay = positionList.map(
        ({
          filledSlots,
          positionName,
          roleRequiredId,
          shiftPositionId,
          totalSlots,
        }) => {
          const isShiftPositionAvailable =
            (isAuthenticated && isAdmin) ||
            (totalSlots - filledSlots > 0 &&
              (roleRequiredId === 0 ||
                volunteerSelected?.roleList?.some(
                  ({ id: roleId }: { id: number }) => roleId === roleRequiredId
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
          endTime,
          filledSlots,
          id: timeId,
          startTime,
          totalSlots,
          type,
        }: IResShiftRowItem) => {
          const isShiftPositionAvailable =
            (isAuthenticated && isAdmin) ||
            (totalSlots - filledSlots > 0 &&
              dayjs(dateTimeValue).isBefore(dayjs(startTime)));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${timeId}-training`}
              value={timeId}
            >
              {`${formatDateName(startTime)}, ${formatTime(
                startTime,
                endTime
              )}, ${type}: ${filledSlots} / ${totalSlots}`}
            </MenuItem>
          );
        }
      );

      // display training position list
      if (dataTrainingVolunteerDetails) {
        trainingPositionListDisplay =
          dataTrainingVolunteerDetails.positionList.map(
            ({
              filledSlots,
              positionName,
              roleRequiredId,
              shiftPositionId,
              totalSlots,
            }) => {
              const isShiftPositionAvailable =
                (isAuthenticated && isAdmin) ||
                (totalSlots - filledSlots > 0 &&
                  (roleRequiredId === 0 ||
                    volunteerSelected?.roleList?.some(
                      ({ id: roleId }: { id: number }) =>
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
        ({ playaName, shiftboardId, worldName }) => ({
          label: `${playaName} "${worldName}"`,
          shiftboardId,
        })
      );

      // display shift position list
      positionListDisplay = positionList.map(
        ({ filledSlots, positionName, shiftPositionId, totalSlots }) => (
          <MenuItem key={`${shiftPositionId}-position`} value={shiftPositionId}>
            {positionName}: {filledSlots} / {totalSlots}
          </MenuItem>
        )
      );

      // display training list
      trainingListDisplay = trainingList.map(
        ({
          endTime,
          filledSlots,
          id,
          startTime,
          totalSlots,
          type,
        }: IResShiftRowItem) => {
          const isShiftPositionAvailable =
            (isAuthenticated && isAdmin) ||
            (totalSlots - filledSlots > 0 &&
              dayjs(dateTimeValue).isBefore(dayjs(startTime)));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${id}-training`}
              value={id}
            >
              {`${formatDateName(startTime)}, ${formatTime(
                startTime,
                endTime
              )}, ${type}: ${filledSlots} / ${totalSlots}`}
            </MenuItem>
          );
        }
      );

      // display training position list
      if (dataTrainingVolunteerDetails) {
        trainingPositionListDisplay =
          dataTrainingVolunteerDetails.positionList.map(
            ({ filledSlots, positionName, shiftPositionId, totalSlots }) => (
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

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const volunteerAdd = ensure(
        dataVolunteerList.find(
          ({ shiftboardId }) =>
            shiftboardId === formValues.volunteer?.shiftboardId
        )
      );
      const shiftPositionAdd = ensure(
        positionList.find(
          ({ shiftPositionId }) =>
            shiftPositionId === formValues.shiftPositionId
        )
      );
      const trainingAdd = dataTrainingList.find(
        ({ id: trainingId }) => trainingId === formValues.trainingTimesId
      );
      const trainingPositionAdd =
        dataTrainingVolunteerDetails?.positionList.find(
          ({ shiftPositionId }) =>
            shiftPositionId === formValues.trainingPositionId
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

      const body: IReqShiftVolunteerItem = {
        id: ensure(timeId),
        noShow: noShowShift,
        shiftboardId: ensure(formValues.volunteer?.shiftboardId),
        shiftPositionId: formValues.shiftPositionId,
      };

      // update database
      await trigger({
        body,
        method: "POST",
      });
      // emit event
      socket.emit("req-shift-volunteer-add", {
        noShow: noShowShift,
        playaName: volunteerAdd.playaName,
        positionName: shiftPositionAdd.positionName,
        shiftboardId: formValues.volunteer?.shiftboardId,
        shiftPositionId: formValues.shiftPositionId,
        timeId,
        worldName: volunteerAdd.worldName,
      });

      // add training position
      if (trainingAdd) {
        const body: IReqShiftVolunteerItem = {
          id: ensure(timeId),
          noShow: noShowShift,
          shiftboardId: ensure(formValues.volunteer?.shiftboardId),
          shiftPositionId: formValues.shiftPositionId,
        };

        // update database
        await trigger({
          body,
          method: "POST",
        });
        // emit event
        socket.emit("req-shift-volunteer-add", {
          noShow: noShowTraining,
          playaName: volunteerAdd.playaName,
          positionName: trainingPositionAdd?.positionName,
          shiftboardId: formValues.volunteer?.shiftboardId,
          shiftPositionId: formValues.trainingPositionId,
          timeId: formValues.trainingTimesId,
          worldName: volunteerAdd.worldName,
        });
      }

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {volunteerAdd.playaName} &quot;{volunteerAdd.worldName}&quot;
          </strong>{" "}
          for <strong>{shiftPositionAdd.positionName}</strong> has been added
        </SnackbarText>,
        {
          variant: "success",
        }
      );
      handleDialogClose();
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
    <DialogContainer
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
      text="Add volunteer"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid size={6}>
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
                  onChange={(_event, value) => field.onChange(value)}
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
                    const isVolunteerSlotAvailable = volunteerList.every(
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
          <Grid size={6}>
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
                      const shiftPositionFound = positionList.find(
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
                    {positionListDisplay}
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
              <Grid size={6}>
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
                          const trainingItemFound = ensure(
                            dataTrainingList.find(
                              (dataTrainingItem: IResShiftRowItem) =>
                                dataTrainingItem.id === trainingTimesIdSelected
                            )
                          );
                          const isVolunteerTrainingAvailable =
                            dataVolunteerShiftList.every(
                              (dataVolunteerShiftList) =>
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
                                  trainingItemFound.startTime,
                                  trainingItemFound.dateName
                                )}, ${formatTime(
                                  trainingItemFound.startTime,
                                  trainingItemFound.endTime
                                )}, ${trainingItemFound.type}`}</strong>{" "}
                                shift will cause a time conflict for{" "}
                                <strong>
                                  {volunteerSelected?.playaName} &quot;
                                  {volunteerSelected?.worldName}
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
              <Grid size={6}>
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
                            dataTrainingVolunteerDetails.positionList.find(
                              (trainingPositionItem) =>
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
            <Grid size={12}>
              <Typography gutterBottom>Position Details:</Typography>
              {positionList.find(
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
            onClick={handleDialogClose}
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
                <PersonAddAlt1Icon />
              )
            }
            type="submit"
            variant="contained"
          >
            Add volunteer
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
