import {
  Close as CloseIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
} from "@mui/icons-material";
import {
  Alert,
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
import { io } from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "@/components/general/DialogContainer";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { FormattedText } from "@/components/general/FormattedText";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IVolunteerOption, TCheckInTypes } from "@/components/types";
import type {
  IReqShiftVolunteerItem,
  IResShiftPositionCountItem,
  IResShiftRowItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "@/components/types/shifts";
import type {
  IResVolunteerDefaultItem,
  IResVolunteerShiftItem,
} from "@/components/types/volunteers";
import {
  ADD_SHIFT_VOLUNTEER_REQ,
  SHIFT_DURING,
  SHIFT_FUTURE,
  SHIFT_PAST,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin, checkIsAuthenticated } from "@/utils/checkIsRoleExist";
import { ensure } from "@/utils/ensure";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";
import { getCheckInType } from "@/utils/getCheckInType";

interface IFormValues {
  timeIdTraining: number | "";
  timePositionIdShift: number | "";
  timePositionIdTraining: number | "";
  volunteer: null | IVolunteerOption;
}
interface IShiftVolunteersDialogAddProps {
  checkInType: TCheckInTypes;
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shiftVolunteersItem: {
    positionList: IResShiftPositionCountItem[];
    shift: {
      date: string;
      dateName: string;
      details: string;
      endTime: string;
      startTime: string;
      typeName: string;
    };
    timeId: number;
    volunteerList: IResShiftVolunteerRowItem[];
  };
}

const socket = io();
const defaultValues: IFormValues = {
  timeIdTraining: "",
  timePositionIdShift: "",
  timePositionIdTraining: "",
  volunteer: null,
};
export const ShiftVolunteersDialogAdd = ({
  checkInType,
  handleDialogClose,
  isDialogOpen,
  shiftVolunteersItem: {
    positionList,
    shift: { date, dateName, details, endTime, startTime, typeName },
    timeId: timeIdShift,
    volunteerList,
  },
}: IShiftVolunteersDialogAddProps) => {
  // context
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
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
  const timeIdTrainingWatch = watch("timeIdTraining");
  const timePositionIdShiftWatch = watch("timePositionIdShift");
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
      ? `/api/volunteers/${volunteerWatch?.shiftboardId}/shifts`
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
    timeIdTrainingWatch
      ? `/api/shifts/${timeIdTrainingWatch}/volunteers`
      : null,
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/${timeIdShift}/volunteers`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // ------------------------------------------------------------
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
        timeIdTraining: "",
        timePositionIdShift: "",
        timePositionIdTraining: "",
        volunteer: { label: `${playaName} "${worldName}"`, shiftboardId },
      });
    } else if (isDialogOpen) {
      reset({
        timeIdTraining: "",
        timePositionIdShift: "",
        timePositionIdTraining: "",
        volunteer: null,
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
            dayjs(volunteerShiftItem.shift.startTime),
            dayjs(volunteerShiftItem.shift.endTime),
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
            )}, ${typeName}`}</strong>{" "}
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
    typeName,
    startTime,
    volunteerList,
    volunteerSelected,
  ]);

  // Config-driven signup-rule warnings (#436 art tour / #429 stewardship).
  // When a position carrying a rule is selected, warn (allow-proceed) if the
  // candidate would exceed max_per_volunteer for that position, or falls short
  // of min_scheduled_csp. Mirrors the time-conflict warning above —
  // informational only, never blocks; admins see it too but are never gated.
  useEffect(() => {
    if (!dataVolunteerShiftList || !timePositionIdShiftWatch) return;
    const selectedPosition = positionList.find(
      (positionItem) =>
        positionItem.timePositionId === timePositionIdShiftWatch
    );
    if (!selectedPosition) return;
    const { maxPerVolunteer, minScheduledCsp, positionId, positionName } =
      selectedPosition;
    const volunteerLabel = `${volunteerSelected?.playaName} "${volunteerSelected?.worldName}"`;

    // candidate's current active (non-canceled) signups
    const activeShifts = dataVolunteerShiftList.filter(
      ({ shift }) => !shift.canceled
    );

    // max_per_volunteer: count existing holdings of this position, excluding
    // the slot being added so a re-add isn't double-counted.
    if (maxPerVolunteer != null) {
      const heldCount = activeShifts.filter(
        ({ shift }) =>
          shift.positionId === positionId &&
          shift.timePositionId !== timePositionIdShiftWatch
      ).length;
      if (heldCount >= maxPerVolunteer) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{volunteerLabel}</strong> already has {heldCount}{" "}
            <strong>{positionName}</strong>{" "}
            {heldCount === 1 ? "signup" : "signups"} — volunteers are asked to
            take at most {maxPerVolunteer}.
          </SnackbarText>,
          { variant: "warning" }
        );
      }
    }

    // min_scheduled_csp: total scheduled CSP must meet the threshold.
    if (minScheduledCsp != null) {
      const scheduledCsp = activeShifts.reduce(
        (sum, { shift }) => sum + (shift.csp ?? 0),
        0
      );
      if (scheduledCsp < minScheduledCsp) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{positionName}</strong> is for active volunteers —{" "}
            <strong>{volunteerLabel}</strong> has {scheduledCsp} CSP scheduled
            but needs at least {minScheduledCsp}. Sign up for a work shift
            first.
          </SnackbarText>,
          { variant: "warning" }
        );
      }
    }
  }, [
    dataVolunteerShiftList,
    enqueueSnackbar,
    positionList,
    timePositionIdShiftWatch,
    volunteerSelected,
  ]);

  // logic
  // ------------------------------------------------------------
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
  const prerequisiteIdWatch = positionList.find(
    (shiftPositionItem) =>
      shiftPositionItem.timePositionId === timePositionIdShiftWatch
  )?.prerequisiteId;
  dayjs.extend(isBetween);

  // evaluate check-in type and available shifts and positions
  let volunteerListDisplay: IVolunteerOption[] = [];
  let positionListDisplay: React.JSX.Element[] = [];
  const trainingListFiltered = dataTrainingList.filter(
    ({ category: { id: categoryId }, startTime: startTimeTraining }) =>
      // include trainings that match the prerequisite ID
      categoryId === prerequisiteIdWatch &&
      // include trainings with start times that are before the current shift start time
      dayjs(startTimeTraining).isBefore(dayjs(startTime))
  );
  let trainingPositionItemFound: IResVolunteerShiftItem | undefined;
  // find training shift that already exists in volunteer shifts
  const trainingItemFound = trainingListFiltered.find(
    ({ id: timeIdTraining }) => {
      // find training position that already exists in volunteer shifts
      const dataVolunteerShiftItem = dataVolunteerShiftList.find(
        ({ shift: { timeId: timeIdShift } }) => timeIdShift === timeIdTraining
      );

      if (dataVolunteerShiftItem) {
        trainingPositionItemFound = dataVolunteerShiftItem;

        return true;
      }

      return false;
    }
  );
  let trainingListDisplay: React.JSX.Element[] = [];
  let trainingPositionListDisplay: React.JSX.Element[] = [];
  let noShowShift: string;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      // evaluate check-in value
      noShowShift = "X";

      // display volunteer list
      if (isAdmin) {
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

      // display position list
      positionListDisplay = positionList.map(
        ({
          positionName,
          roleRequiredId,
          slotsFilled,
          slotsTotal,
          timePositionId,
        }) => {
          const isShiftPositionAvailable =
            isAdmin ||
            (slotsTotal - slotsFilled > 0 &&
              (roleRequiredId === 0 ||
                volunteerSelected?.roleList?.some(
                  ({ id: roleId }: { id: number }) => roleId === roleRequiredId
                )));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${timePositionId}-position`}
              value={timePositionId}
            >
              {positionName}: {slotsFilled} / {slotsTotal}
            </MenuItem>
          );
        }
      );

      // display training list
      trainingListDisplay = trainingListFiltered.map(
        ({
          date,
          dateName,
          endTime,
          id: timeIdTraining,
          slotsFilled,
          slotsTotal,
          startTime,
          type,
        }: IResShiftRowItem) => {
          const isShiftPositionAvailable =
            isAdmin ||
            (slotsTotal - slotsFilled > 0 &&
              dayjs(dateTimeValue).isBefore(dayjs(startTime)));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${timeIdTraining}-training`}
              value={timeIdTraining}
            >
              {`${formatDateName(date, dateName)}, ${formatTime(
                startTime,
                endTime
              )}, ${type}: ${slotsFilled} / ${slotsTotal}`}
            </MenuItem>
          );
        }
      );

      // display training position list
      if (dataTrainingVolunteerDetails) {
        trainingPositionListDisplay =
          dataTrainingVolunteerDetails.positionList.map(
            ({
              positionName,
              roleRequiredId,
              slotsFilled,
              slotsTotal,
              timePositionId,
            }) => {
              const isShiftPositionAvailable =
                isAdmin ||
                (slotsTotal - slotsFilled > 0 &&
                  (roleRequiredId === 0 ||
                    volunteerSelected?.roleList?.some(
                      ({ id: roleId }: { id: number }) =>
                        roleId === roleRequiredId
                    )));

              return (
                <MenuItem
                  disabled={!isShiftPositionAvailable}
                  key={`${timePositionId}-position`}
                  value={timePositionId}
                >
                  {positionName}: {slotsFilled} / {slotsTotal}
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

      // display position list
      positionListDisplay = positionList.map(
        ({ positionName, slotsFilled, slotsTotal, timePositionId }) => (
          <MenuItem key={`${timePositionId}-position`} value={timePositionId}>
            {positionName}: {slotsFilled} / {slotsTotal}
          </MenuItem>
        )
      );

      // display training list
      trainingListDisplay = trainingListFiltered.map(
        ({
          date,
          dateName,
          endTime,
          id: timeIdTraining,
          slotsFilled,
          slotsTotal,
          startTime,
          type,
        }: IResShiftRowItem) => {
          const isShiftPositionAvailable =
            isAdmin ||
            (slotsTotal - slotsFilled > 0 &&
              dayjs(dateTimeValue).isBefore(dayjs(startTime)));

          return (
            <MenuItem
              disabled={!isShiftPositionAvailable}
              key={`${timeIdTraining}-training`}
              value={timeIdTraining}
            >
              {`${formatDateName(date, dateName)}, ${formatTime(
                startTime,
                endTime
              )}, ${type}: ${slotsFilled} / ${slotsTotal}`}
            </MenuItem>
          );
        }
      );

      // display training position list
      if (dataTrainingVolunteerDetails) {
        trainingPositionListDisplay =
          dataTrainingVolunteerDetails.positionList.map(
            ({ positionName, slotsFilled, slotsTotal, timePositionId }) => (
              <MenuItem
                key={`${timePositionId}-position`}
                value={timePositionId}
              >
                {positionName}: {slotsFilled} / {slotsTotal}
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
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    // Non-admin signup blocks (#424 double-booking, #438 over-limit positions
    // like a 2nd art tour, #436 art-tour CSP gate). One check here on submit:
    // if a rule is violated, pop a red error snackbar and stop — the add does
    // not happen. Admins are exempt (they still get the orange warnings on
    // selection and can override). Client-side gate, consistent with the
    // existing full-shift/slot gating; server unchanged.
    if (!isAdmin) {
      // Fail closed: if the volunteer's current shifts haven't loaded yet we
      // can't verify the rules, so don't let the signup through unchecked.
      if (!dataVolunteerShiftList) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              Still checking your current shifts — please try again in a moment.
            </strong>
          </SnackbarText>,
          { variant: "error" }
        );
        return;
      }
      const activeShifts = dataVolunteerShiftList.filter(
        ({ shift }) => !shift.canceled
      );
      const selectedPosition = positionList.find(
        (positionItem) =>
          positionItem.timePositionId === formValues.timePositionIdShift
      );

      // #424 — overlapping shift times. Strict overlap (isBefore, not
      // isBetween) so back-to-back shifts that only touch endpoints are fine.
      const hasTimeConflict = activeShifts.some(
        ({ shift }) =>
          dayjs(shift.startTime).isBefore(dayjs(endTime)) &&
          dayjs(startTime).isBefore(dayjs(shift.endTime))
      );

      let blockMessage: string | null = null;
      if (hasTimeConflict) {
        blockMessage =
          "This shift overlaps a shift you’re already signed up for — you can’t be in two places at once. Please remove the other shift first if you’d like to take this one.";
      } else if (selectedPosition?.maxPerVolunteer != null) {
        // #438 — at most maxPerVolunteer of this position across all shifts.
        const heldCount = activeShifts.filter(
          ({ shift }) =>
            shift.positionId === selectedPosition.positionId &&
            shift.timePositionId !== formValues.timePositionIdShift
        ).length;
        if (heldCount >= selectedPosition.maxPerVolunteer) {
          blockMessage = `You’re already signed up for the most ${
            selectedPosition.positionName
          } ${
            selectedPosition.maxPerVolunteer === 1 ? "shift" : "shifts"
          } allowed (${
            selectedPosition.maxPerVolunteer
          }). Please remove one first if you’d like to change it.`;
        }
      }

      // #436 — art-tour CSP gate: must already have at least minScheduledCsp of
      // scheduled CSP (a real work shift) to take the seat.
      if (!blockMessage && selectedPosition?.minScheduledCsp != null) {
        const scheduledCsp = activeShifts.reduce(
          (sum, { shift }) => sum + (shift.csp ?? 0),
          0
        );
        if (scheduledCsp < selectedPosition.minScheduledCsp) {
          blockMessage = `${selectedPosition.positionName} is a thank-you for active volunteers — please sign up for at least one work shift before adding it.`;
        }
      }

      if (blockMessage) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{blockMessage}</strong>
          </SnackbarText>,
          { variant: "error" }
        );
        return;
      }
    }

    try {
      const volunteerAdd = ensure(
        dataVolunteerList.find(
          ({ shiftboardId }) =>
            shiftboardId === formValues.volunteer?.shiftboardId
        )
      );
      const shiftPositionAdd = ensure(
        positionList.find(
          ({ timePositionId: timePositionIdShift }) =>
            timePositionIdShift === formValues.timePositionIdShift
        )
      );
      const trainingAdd = dataTrainingList.find(
        ({ id: timeIdTraining }) => timeIdTraining === formValues.timeIdTraining
      );
      const trainingPositionAdd =
        dataTrainingVolunteerDetails?.positionList.find(
          ({ timePositionId: timePositionIdTraining }) =>
            timePositionIdTraining === formValues.timePositionIdTraining
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

      // add position
      const body: IReqShiftVolunteerItem = {
        id: ensure(timeIdShift),
        noShow: noShowShift,
        shiftboardId: ensure(formValues.volunteer?.shiftboardId),
        timePositionId: formValues.timePositionIdShift,
      };

      // update database
      await trigger({
        body,
        method: "POST",
      });
      // emit event
      socket.emit(ADD_SHIFT_VOLUNTEER_REQ, {
        noShow: noShowShift,
        playaName: volunteerAdd.playaName,
        positionName: shiftPositionAdd.positionName,
        shiftboardId: formValues.volunteer?.shiftboardId,
        timeId: timeIdShift,
        timePositionId: formValues.timePositionIdShift,
        worldName: volunteerAdd.worldName,
      });

      // add training
      if (trainingAdd) {
        const body: IReqShiftVolunteerItem = {
          id: ensure(timeIdShift),
          noShow: noShowShift,
          shiftboardId: ensure(formValues.volunteer?.shiftboardId),
          timePositionId: formValues.timePositionIdTraining,
        };

        // update database
        await trigger({
          body,
          method: "POST",
        });
        // emit event
        socket.emit(ADD_SHIFT_VOLUNTEER_REQ, {
          noShow: noShowTraining,
          playaName: volunteerAdd.playaName,
          positionName: trainingPositionAdd?.positionName,
          shiftboardId: formValues.volunteer?.shiftboardId,
          timeId: formValues.timeIdTraining,
          timePositionId: formValues.timePositionIdTraining,
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
  // ------------------------------------------------------------
  let trainingDisplay: React.ReactNode;

  if (trainingItemFound) {
    trainingDisplay = (
      <Alert severity="info">
        This shift requires training, and you have already signed up for the
        following:
        <br />
        <strong>{trainingItemFound.type}</strong> as{" "}
        <strong>{trainingPositionItemFound?.shift.positionName}</strong> on{" "}
        <strong>
          {formatDateName(
            trainingItemFound.startTime,
            trainingItemFound.dateName
          )}
        </strong>{" "}
        at{" "}
        <strong>
          {formatTime(trainingItemFound.startTime, trainingItemFound.endTime)}
        </strong>
      </Alert>
    );
  } else if (
    timePositionIdShiftWatch !== "" &&
    prerequisiteIdWatch !== 0 &&
    trainingListFiltered.length === 0
  ) {
    trainingDisplay = (
      <Alert severity="warning">
        This shift requires training. However, there are no available trainings
        between now and the shift start time. If you have not enrolled in a
        training <strong>this</strong> year, please speak with a lead before
        signing up for this shift.
      </Alert>
    );
  } else if (trainingListFiltered.length > 0) {
    trainingDisplay = (
      <>
        <Grid size={6}>
          <Controller
            control={control}
            name="timeIdTraining"
            render={({ field }) => (
              <FormControl fullWidth required variant="standard">
                <InputLabel id="timeIdTraining">Training time</InputLabel>
                <Select
                  {...field}
                  error={Boolean(errors.timeIdTraining)}
                  label="Training time *"
                  labelId="timeIdTraining"
                  onChange={(event) => {
                    const timeIdTrainingSelected = event.target.value;
                    const trainingItemFound = ensure(
                      dataTrainingList.find(
                        (dataTrainingItem: IResShiftRowItem) =>
                          dataTrainingItem.id === timeIdTrainingSelected
                      )
                    );
                    const isVolunteerTrainingAvailable =
                      dataVolunteerShiftList.every(
                        (dataVolunteerShiftList) =>
                          !dayjs(trainingItemFound.startTime).isBetween(
                            dayjs(dataVolunteerShiftList.shift.startTime),
                            dayjs(dataVolunteerShiftList.shift.endTime),
                            null,
                            "[]"
                          )
                      );

                    // update field
                    field.onChange(timeIdTrainingSelected);

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
                >
                  {trainingListDisplay}
                </Select>
                {errors.timeIdTraining && (
                  <FormHelperText error>
                    {errors.timeIdTraining.message}
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
            name="timePositionIdTraining"
            render={({ field }) => (
              <FormControl fullWidth required variant="standard">
                <InputLabel id="timePositionIdTraining">
                  Training position
                </InputLabel>
                <Select
                  {...field}
                  disabled={!timeIdTrainingWatch}
                  error={Boolean(errors.timePositionIdTraining)}
                  label="Training position *"
                  labelId="timePositionIdTraining"
                  onChange={(event) => {
                    const trainingPositionSelected = event.target.value;
                    const trainingPositionFound =
                      dataTrainingVolunteerDetails.positionList.find(
                        (trainingPositionItem) =>
                          trainingPositionItem.timePositionId ===
                          trainingPositionSelected
                      );

                    // update field
                    field.onChange(trainingPositionSelected);

                    // if there are less than or equal to zero slots available
                    // then display warning notification
                    if (
                      trainingPositionFound &&
                      trainingPositionFound.slotsFilled >=
                        trainingPositionFound.slotsTotal
                    ) {
                      enqueueSnackbar(
                        <SnackbarText>
                          There are{" "}
                          <strong>
                            {trainingPositionFound.slotsTotal -
                              trainingPositionFound.slotsFilled}
                          </strong>{" "}
                          openings available for{" "}
                          <strong>{trainingPositionFound.positionName}</strong>
                        </SnackbarText>,
                        {
                          variant: "warning",
                        }
                      );
                    }
                  }}
                >
                  {trainingPositionListDisplay}
                </Select>
                {errors.timePositionIdTraining && (
                  <FormHelperText error>
                    {errors.timePositionIdTraining.message}
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
    );
  }

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
              name="timePositionIdShift"
              render={({ field }) => (
                <FormControl fullWidth required variant="standard">
                  <InputLabel id="timePositionIdShift">Position</InputLabel>
                  <Select
                    {...field}
                    error={Boolean(errors.timePositionIdShift)}
                    disabled={!volunteerWatch}
                    label="Position *"
                    labelId="timePositionIdShift"
                    onChange={(event) => {
                      const shiftPositionSelected = event.target.value;
                      const shiftPositionFound = positionList.find(
                        (shiftPositionItem) =>
                          shiftPositionItem.timePositionId ===
                          shiftPositionSelected
                      );

                      // update field
                      field.onChange(shiftPositionSelected);

                      // if there are less than or equal to zero slots available
                      // then display warning notification
                      if (
                        shiftPositionFound &&
                        shiftPositionFound.slotsFilled >=
                          shiftPositionFound.slotsTotal
                      ) {
                        enqueueSnackbar(
                          <SnackbarText>
                            There are{" "}
                            <strong>
                              {shiftPositionFound.slotsTotal -
                                shiftPositionFound.slotsFilled}
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
                  >
                    {positionListDisplay}
                  </Select>
                  {errors.timePositionIdShift && (
                    <FormHelperText error>
                      {errors.timePositionIdShift.message}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
              rules={{
                required: "Position is required",
              }}
            />
          </Grid>

          {/* training */}
          {trainingDisplay}

          {/* position details — when a position has no description of its own,
              fall back to the shift description so the sign-up pop-up never
              shows a blank/"Not available." field (per Chipper 2026-06-15) */}
          {timePositionIdShiftWatch &&
            (() => {
              const positionDetails = positionList.find(
                (shiftPositionItem) =>
                  shiftPositionItem.timePositionId === timePositionIdShiftWatch
              )?.positionDetails;
              const detailsText =
                positionDetails && positionDetails.trim()
                  ? positionDetails
                  : details || "Not available.";
              return (
                <Grid size={12}>
                  <Typography gutterBottom>Position Details:</Typography>
                  <FormattedText text={detailsText} />
                </Grid>
              );
            })()}
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
