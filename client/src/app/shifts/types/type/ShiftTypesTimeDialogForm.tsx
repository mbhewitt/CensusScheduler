import {
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
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

import { IFormValues } from "@/app/shifts/types/type";
import { MEAL_LIST } from "@/constants";

interface IShiftTypesTimeDialogFormProps {
  clearErrors: UseFormClearErrors<IFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  getValues: UseFormGetValues<IFormValues>;
  setError: UseFormSetError<IFormValues>;
  timePositionListAddFields: FieldArrayWithId<
    IFormValues,
    "timeAdd.positionList",
    "id"
  >[];
}

export const ShiftTypesTimeDialogForm = ({
  clearErrors,
  control,
  errors,
  getValues,
  setError,
  timePositionListAddFields,
}: IShiftTypesTimeDialogFormProps) => {
  // render
  // ------------------------------------------------------------
  return (
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
                  const startTimeCurrent = dayjs(event).format("HH:mm");
                  const endTimeCurrent = dayjs(
                    getValues("timeAdd.endTime")
                  ).format("HH:mm");

                  const dateCurrent = dayjs().format("YYYY-MM-DD");
                  const startDateTimeCurrent = `${dateCurrent} ${startTimeCurrent}`;
                  const endDateTimeCurrent = `${dateCurrent} ${endTimeCurrent}`;

                  if (event) {
                    if (
                      dayjs(startDateTimeCurrent).isSameOrAfter(
                        endDateTimeCurrent
                      )
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
                  const endTimeCurrent = dayjs(event).format("HH:mm");
                  const startTimeCurrent = dayjs(
                    getValues("timeAdd.startTime")
                  ).format("HH:mm");

                  const dateCurrent = dayjs().format("YYYY-MM-DD");
                  const endDateTimeCurrent = `${dateCurrent} ${endTimeCurrent}`;
                  const startDateTimeCurrent = `${dateCurrent} ${startTimeCurrent}`;

                  if (event) {
                    if (
                      dayjs(endDateTimeCurrent).isSameOrBefore(
                        startDateTimeCurrent
                      )
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
          name="timeAdd.meal"
          render={({ field }) => (
            <FormControl fullWidth required variant="standard">
              <InputLabel id="meal">Meal</InputLabel>
              <Select {...field} label="Meal *" labelId="meal">
                {MEAL_LIST.map((mealItem) => (
                  <MenuItem key={mealItem} value={mealItem}>
                    {mealItem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid size={6}>
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
      <Grid size={6} />
      <Grid size={12}>
        <Controller
          control={control}
          name="timeAdd.notes"
          render={({ field }) => (
            <TextField {...field} fullWidth label="Notes" variant="standard" />
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
            <Grid container size={12} key={timePositionAddItem.id}>
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
                        errors.timeAdd.positionList[timePositionAddIndex]?.alias
                          ?.message
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
                        errors.timeAdd.positionList[timePositionAddIndex]?.slots
                          ?.message
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
  );
};
