import {
  Close as CloseIcon,
  MoreTime as MoreTimeIcon,
} from "@mui/icons-material";
import {
  Button,
  DialogActions,
  Grid2 as Grid,
  TextField,
  Typography,
} from "@mui/material";
import {
  DatePicker,
  LocalizationProvider,
  TimePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
} from "react-hook-form";

import { IFormValues, ITimeAddValues } from "@/app/shifts/types/type";
import { DialogContainer } from "@/components/general/DialogContainer";

interface IShiftTypesTimeDialogAddProps {
  clearErrors: UseFormClearErrors<IFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  getValues: UseFormGetValues<IFormValues>;
  handleDialogClose: () => void;
  handleTimeAdd: (time: ITimeAddValues) => void;
  isDialogOpen: boolean;
  setError: UseFormSetError<IFormValues>;
  timeFields: FieldArrayWithId<IFormValues, "timeList", "id">[];
  timePositionListAddFields: FieldArrayWithId<
    IFormValues,
    "timeAdd.positionList",
    "id"
  >[];
}

export const ShiftTypesTimeDialogAdd = ({
  clearErrors,
  control,
  errors,
  getValues,
  handleDialogClose,
  handleTimeAdd,
  isDialogOpen,
  setError,
  timeFields,
  timePositionListAddFields,
}: IShiftTypesTimeDialogAddProps) => {
  // render
  // --------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
      text="Add time"
    >
      <Grid container spacing={2}>
        <Grid size={3}>
          <Controller
            control={control}
            name="timeAdd.date"
            render={({ field: { onChange, value } }) => (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  onChange={(event) => {
                    // update field
                    onChange(event);

                    if (event) {
                      clearErrors("timeAdd.date");
                    }
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(errors.timeAdd?.date),
                      fullWidth: true,
                      helperText: errors.timeAdd?.date?.message,
                      onBlur: (event) => {
                        if (event.target.value === "MM/DD/YYYY") {
                          setError("timeAdd.date", {
                            type: "required",
                            message: "Date is required",
                          });
                        }
                      },
                      required: true,
                      variant: "standard",
                    },
                  }}
                  value={dayjs(value)}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>
        <Grid size={3}>
          <Controller
            control={control}
            name="timeAdd.startTime"
            render={({ field: { onChange, value } }) => (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  ampm={false}
                  label="Start time"
                  onChange={(event) => {
                    // update field
                    onChange(event);

                    // validate start time occurs before end time
                    const startTimeActive = dayjs(event).format("HH:mm");
                    const endTimeActive = dayjs(
                      getValues("timeAdd.endTime")
                    ).format("HH:mm");

                    const dateCurrent = dayjs().format("YYYY-MM-DD");
                    const startTimeCurrent = `${dateCurrent} ${startTimeActive}`;
                    const endTimeCurrent = `${dateCurrent} ${endTimeActive}`;

                    if (event) {
                      if (
                        dayjs(startTimeCurrent).isSameOrAfter(endTimeCurrent)
                      ) {
                        setError("timeAdd.startTime", {
                          type: "custom",
                          message: "Start time must occur before end time",
                        });
                      } else {
                        clearErrors("timeAdd.startTime");
                        clearErrors("timeAdd.endTime");
                      }
                    }
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(errors.timeAdd?.startTime),
                      fullWidth: true,
                      helperText: errors.timeAdd?.startTime?.message,
                      onBlur: (event) => {
                        if (event.target.value === "hh:mm") {
                          setError("timeAdd.startTime", {
                            type: "required",
                            message: "Start time is required",
                          });
                        }
                      },
                      required: true,
                      variant: "standard",
                    },
                  }}
                  value={dayjs(value)}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>
        <Grid size={3}>
          <Controller
            control={control}
            name="timeAdd.endTime"
            render={({ field: { onChange, value } }) => (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  ampm={false}
                  label="End time"
                  onChange={(event) => {
                    // update field
                    onChange(event);

                    // validate end time occurs after start time
                    const endTimeActive = dayjs(event).format("HH:mm");
                    const startTimeActive = dayjs(
                      getValues("timeAdd.startTime")
                    ).format("HH:mm");

                    const dateCurrent = dayjs().format("YYYY-MM-DD");
                    const endTimeCurrent = `${dateCurrent} ${endTimeActive}`;
                    const startTimeCurrent = `${dateCurrent} ${startTimeActive}`;

                    if (event) {
                      if (
                        dayjs(endTimeCurrent).isSameOrBefore(startTimeCurrent)
                      ) {
                        setError("timeAdd.endTime", {
                          type: "custom",
                          message: "End time must occur after start time",
                        });
                      } else {
                        clearErrors("timeAdd.endTime");
                        clearErrors("timeAdd.startTime");
                      }
                    }
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(errors.timeAdd?.endTime),
                      fullWidth: true,
                      helperText: errors.timeAdd?.endTime?.message,
                      onBlur: (event) => {
                        if (event.target.value === "hh:mm") {
                          setError("timeAdd.endTime", {
                            type: "required",
                            message: "End time is required",
                          });
                        }
                      },
                      required: true,
                      variant: "standard",
                    },
                  }}
                  value={dayjs(value)}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>
        <Grid size={3} />
        <Grid size={3}>
          <Controller
            control={control}
            name="timeAdd.instance"
            render={({ field }) => (
              <TextField
                {...field}
                error={Boolean(errors.timeAdd?.instance)}
                fullWidth
                helperText={errors.timeAdd?.instance?.message}
                label="Instance"
                required
                variant="standard"
              />
            )}
          />
        </Grid>
        <Grid size={9}>
          <Controller
            control={control}
            name="timeAdd.notes"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Notes"
                variant="standard"
              />
            )}
          />
        </Grid>
        {timePositionListAddFields && (
          <Grid size={12}>
            <Typography component="h3" variant="h6">
              Positions
            </Typography>
          </Grid>
        )}
        {timePositionListAddFields.map(
          (timePositionAddItem, timePositionAddIndex) => {
            return (
              <Grid container size={12} key={timePositionAddItem.positionId}>
                <Grid size={6}>
                  <Controller
                    control={control}
                    name={`timeAdd.positionList.${timePositionAddIndex}.name`}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        disabled
                        fullWidth
                        label="Position"
                        variant="standard"
                      />
                    )}
                  />
                </Grid>
                <Grid size={6} />
                <Grid size={6}>
                  <Controller
                    control={control}
                    name={`timeAdd.positionList.${timePositionAddIndex}.alias`}
                    render={({ field: { onChange, value } }) => (
                      <TextField
                        error={
                          errors.timeAdd?.positionList &&
                          Boolean(
                            errors.timeAdd.positionList[timePositionAddIndex]
                              ?.alias
                          )
                        }
                        fullWidth
                        helperText={
                          errors.timeAdd?.positionList &&
                          errors.timeAdd.positionList[timePositionAddIndex]
                            ?.alias?.message
                        }
                        label="Alias"
                        onBlur={(event) => {
                          if (event.target.value === "") {
                            setError(
                              `timeAdd.positionList.${timePositionAddIndex}.alias`,
                              {
                                type: "required",
                                message: "Alias is required",
                              }
                            );
                          }
                        }}
                        onChange={(event) => {
                          // update field
                          onChange(event);

                          if (event.target.value) {
                            clearErrors(
                              `timeAdd.positionList.${timePositionAddIndex}.slots`
                            );
                          }
                        }}
                        required
                        variant="standard"
                        value={value}
                      />
                    )}
                  />
                </Grid>
                <Grid size={3}>
                  <Controller
                    control={control}
                    name={`timeAdd.positionList.${timePositionAddIndex}.slots`}
                    render={({ field: { onChange, value } }) => (
                      <TextField
                        error={
                          errors.timeAdd?.positionList &&
                          Boolean(
                            errors.timeAdd.positionList[timePositionAddIndex]
                              ?.slots
                          )
                        }
                        fullWidth
                        helperText={
                          errors.timeAdd?.positionList &&
                          errors.timeAdd.positionList[timePositionAddIndex]
                            ?.slots?.message
                        }
                        label="Slots"
                        onBlur={(event) => {
                          if (event.target.value === "") {
                            setError(
                              `timeAdd.positionList.${timePositionAddIndex}.slots`,
                              {
                                type: "required",
                                message: "Slots is required",
                              }
                            );
                          }
                        }}
                        onChange={(event) => {
                          // update field
                          onChange(event);

                          if (event.target.value) {
                            clearErrors(
                              `timeAdd.positionList.${timePositionAddIndex}.slots`
                            );
                          }
                        }}
                        required
                        type="number"
                        value={value}
                        variant="standard"
                      />
                    )}
                    rules={{
                      required: "Total slots is required",
                    }}
                  />
                </Grid>
                <Grid size={3}>
                  <Controller
                    control={control}
                    name={`timeAdd.positionList.${timePositionAddIndex}.sapPoints`}
                    render={({ field: { onChange, value } }) => (
                      <TextField
                        error={
                          errors.timeAdd?.positionList &&
                          Boolean(
                            errors.timeAdd.positionList[timePositionAddIndex]
                              ?.sapPoints
                          )
                        }
                        fullWidth
                        helperText={
                          errors.timeAdd?.positionList &&
                          errors.timeAdd.positionList[timePositionAddIndex]
                            ?.sapPoints?.message
                        }
                        label="SAP points"
                        onBlur={(event) => {
                          if (event.target.value === "") {
                            setError(
                              `timeAdd.positionList.${timePositionAddIndex}.sapPoints`,
                              {
                                type: "required",
                                message: "SAP points is required",
                              }
                            );
                          }
                        }}
                        onChange={(event) => {
                          // update field
                          onChange(event);

                          if (event.target.value) {
                            clearErrors(
                              `timeAdd.positionList.${timePositionAddIndex}.sapPoints`
                            );
                          }
                        }}
                        required
                        type="number"
                        variant="standard"
                        value={value}
                      />
                    )}
                    rules={{
                      required: "SAP points is required",
                    }}
                  />
                </Grid>
              </Grid>
            );
          }
        )}
      </Grid>
      <DialogActions>
        <Button
          startIcon={<CloseIcon />}
          onClick={handleDialogClose}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disabled={Boolean(errors.timeAdd)}
          onClick={() => {
            if (getValues("timeAdd.date") === "") {
              setError("timeAdd.date", {
                type: "required",
                message: "Date is required",
              });
            }
            if (getValues("timeAdd.startTime") === "") {
              setError("timeAdd.startTime", {
                type: "required",
                message: "Start time is required",
              });
            }
            if (getValues("timeAdd.endTime") === "") {
              setError("timeAdd.endTime", {
                type: "required",
                message: "End time is required",
              });
            }
            if (getValues("timeAdd.instance") === "") {
              setError("timeAdd.instance", {
                type: "required",
                message: "Instance is required",
              });
            }
            timeFields.forEach((timeFieldItem) => {
              if (timeFieldItem.instance === getValues("timeAdd.instance")) {
                setError("timeAdd.instance", {
                  type: "required",
                  message: "Instance must be unique",
                });
              }
            });
            if (!errors.timeAdd) {
              const positionListNew = getValues("timeAdd.positionList").map(
                ({ alias, name, positionId, sapPoints, slots }) => {
                  return {
                    alias,
                    name,
                    positionId,
                    sapPoints,
                    slots,
                    timePositionId: 0,
                  };
                }
              );

              handleTimeAdd({
                date: getValues("timeAdd.date"),
                endTime: getValues("timeAdd.endTime"),
                instance: getValues("timeAdd.instance"),
                notes: getValues("timeAdd.notes"),
                positionList: positionListNew,
                startTime: getValues("timeAdd.startTime"),
              });
              handleDialogClose();
            }
          }}
          startIcon={<MoreTimeIcon />}
          type="button"
          variant="contained"
        >
          Add time
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
