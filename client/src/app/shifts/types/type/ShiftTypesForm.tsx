import {
  Close as CloseIcon,
  GroupAdd as GroupAddIcon,
  MoreTime as MoreTimeIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid2 as Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { useSnackbar } from "notistack";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { SnackbarText } from "@/components/general/SnackbarText";
import type {
  IResShiftTypeCategoryItem,
  IResShiftTypeDefaults,
} from "@/components/types/shifts/types";
import { COLOR_BURNING_MAN_BROWN } from "@/constants";
import { ensure } from "@/utils/ensure";
import { formatDateName, formatTime } from "@/utils/formatDateTime";

dayjs.extend(utc);

export interface IFormValues {
  information: {
    category: { name: string };
    details: string;
    isCore: boolean;
    isOffPlaya: boolean;
    name: string;
  };
  positionList: {
    critical: boolean;
    details: string;
    endTimeOffset: string;
    lead: boolean;
    name: string;
    positionId: number;
    prerequisite: string;
    role: string;
    startTimeOffset: string;
    totalSlots: string;
    wapPoints: string;
  }[];
  timeList: {
    endTime: string;
    date: string;
    instance: string;
    notes: string;
    startTime: string;
    timeId: number;
  }[];
}
interface IShiftTypesFormProps {
  clearErrors: UseFormClearErrors<IFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  dataDefaults: IResShiftTypeDefaults;
  errors: FieldErrors<IFormValues>;
  getValues: UseFormGetValues<IFormValues>;
  handlePositionRemove: (
    index: number,
    name: string,
    positionId: number
  ) => void;
  handleTimeRemove: (index: number, name: string, timeId: number) => void;
  positionAppend: UseFieldArrayAppend<IFormValues, "positionList">;
  positionFields: FieldArrayWithId<IFormValues, "positionList", "id">[];
  setError: UseFormSetError<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
  timeAppend: UseFieldArrayAppend<IFormValues, "timeList">;
  timeFields: FieldArrayWithId<IFormValues, "timeList", "id">[];
  timeRemove: UseFieldArrayRemove;
  typeName: string;
  watch: UseFormWatch<IFormValues>;
}

// utilities
// --------------------
export const processInformation = (
  dataDefaults: IResShiftTypeDefaults,
  formValues: IFormValues
) => {
  const categoryIdFound = ensure(
    dataDefaults.categoryList.find(({ name }) => {
      return name === formValues.information.category.name;
    })
  ).id;

  return {
    category: {
      id: categoryIdFound,
    },
    details: formValues.information.details,
    isCore: formValues.information.isCore,
    isOffPlaya: formValues.information.isOffPlaya,
    name: formValues.information.name,
  };
};
export const processPositionList = (
  dataDefaults: IResShiftTypeDefaults,
  formValues: IFormValues
) => {
  return formValues.positionList.map(({ name, totalSlots, wapPoints }) => {
    const positionIdFound = ensure(
      dataDefaults.positionList.find((positionItem) => {
        return positionItem.name === name;
      })
    ).positionId;

    return {
      positionId: positionIdFound,
      totalSlots,
      wapPoints,
    };
  });
};
export const processTimeList = (formValues: IFormValues) => {
  return formValues.timeList.map(
    ({ endTime, date, instance, notes, startTime, timeId }) => {
      return {
        endTime: `${dayjs(date).format("YYYY-MM-DD")} ${dayjs(endTime).format(
          "HH:mm"
        )}`,
        instance,
        notes,
        startTime: `${dayjs(date).format("YYYY-MM-DD")} ${dayjs(
          startTime
        ).format("HH:mm")}`,
        timeId,
      };
    }
  );
};

export const defaultValues: IFormValues = {
  information: {
    category: { name: "" },
    details: "",
    isCore: false,
    isOffPlaya: false,
    name: "",
  },
  positionList: [
    {
      critical: false,
      details: "",
      endTimeOffset: "",
      lead: false,
      name: "",
      positionId: 0,
      prerequisite: "",
      role: "",
      startTimeOffset: "",
      totalSlots: "",
      wapPoints: "",
    },
  ],
  timeList: [
    {
      endTime: "",
      date: "",
      instance: "",
      notes: "",
      startTime: "",
      timeId: 0,
    },
  ],
};
export const ShiftTypesForm = ({
  clearErrors,
  control,
  dataDefaults,
  errors,
  getValues,
  handlePositionRemove,
  handleTimeRemove,
  positionAppend,
  positionFields,
  setError,
  setValue,
  timeAppend,
  timeFields,
  typeName,
  watch,
}: IShiftTypesFormProps) => {
  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // --------------------
  const watchPositionList = watch("positionList");

  // render
  // --------------------
  return (
    <>
      {/* information */}
      <Box
        sx={{
          mb: 3,
        }}
      >
        <Typography component="h2" sx={{ mb: 2 }} variant="h4">
          Information
        </Typography>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Controller
                  control={control}
                  name="information.name"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      error={
                        errors.information && Boolean(errors.information.name)
                      }
                      fullWidth
                      helperText={
                        errors.information && errors.information.name?.message
                      }
                      label="Name"
                      required
                      variant="standard"
                    />
                  )}
                  rules={{
                    required: "Name is required",
                    validate: {
                      required: (value) => {
                        return Boolean(value.trim()) || "Name is required";
                      },
                      typeNameAvailable: (value) => {
                        const isTypeNameAvailable =
                          value === typeName ||
                          dataDefaults.typeList.every(
                            ({ name }) => name !== value
                          );

                        return (
                          isTypeNameAvailable ||
                          `${value} type has been added already`
                        );
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  control={control}
                  name="information.category.name"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="to">Category *</InputLabel>
                      <Select
                        {...field}
                        error={
                          errors.information &&
                          Boolean(errors.information.category?.name)
                        }
                        label="Category"
                        labelId="category"
                        required
                      >
                        {dataDefaults.categoryList.map(
                          ({ id, name }: IResShiftTypeCategoryItem) => (
                            <MenuItem key={id} value={name}>
                              {name}
                            </MenuItem>
                          )
                        )}
                      </Select>
                      {errors.information &&
                        errors.information.category?.name && (
                          <FormHelperText error>
                            {errors.information.category?.name.message}
                          </FormHelperText>
                        )}
                    </FormControl>
                  )}
                  rules={{
                    required: "Category is required",
                  }}
                />
              </Grid>
              <Grid size={6}>
                <Controller
                  control={control}
                  name="information.details"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Details"
                      variant="standard"
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <FormGroup row>
                  <Controller
                    control={control}
                    name="information.isCore"
                    render={({ field: { value, ...field } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={value}
                            color="secondary"
                          />
                        }
                        label="Core"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="information.isOffPlaya"
                    render={({ field: { value, ...field } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={value}
                            color="secondary"
                          />
                        }
                        label="Off playa"
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* positions */}
      <Box
        sx={{
          mb: 3,
        }}
      >
        <Stack
          alignItems="flex-end"
          direction="row"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography component="h2" variant="h4">
            Positions
          </Typography>
          <Button
            onClick={() => {
              positionAppend(structuredClone(defaultValues.positionList[0]));
              enqueueSnackbar(
                <SnackbarText>
                  <strong>New</strong> position has been added
                  <br />
                  Click on the <strong>Update type</strong> button to finalize
                  your changes
                </SnackbarText>,
                {
                  variant: "success",
                }
              );
            }}
            startIcon={<GroupAddIcon />}
            type="button"
            variant="contained"
          >
            Add position
          </Button>
        </Stack>
        {positionFields.map((item, index) => {
          return (
            <Card
              key={item.id}
              sx={{
                mb: 1,
              }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.name`}
                      render={({ field }) => (
                        <FormControl fullWidth variant="standard">
                          <InputLabel id="to">Position *</InputLabel>
                          <Select
                            {...field}
                            error={
                              errors.positionList &&
                              Boolean(errors.positionList[index]?.name)
                            }
                            label="Position *"
                            labelId="position"
                            onChange={(event) => {
                              const positionSelected = event.target.value;
                              const positionItem =
                                dataDefaults.positionList.find(({ name }) => {
                                  return name === positionSelected;
                                });

                              // update field
                              field.onChange(positionSelected);

                              if (positionItem) {
                                // auto-populate fields
                                setValue(
                                  `positionList.${index}.critical`,
                                  positionItem.critical
                                );
                                setValue(
                                  `positionList.${index}.endTimeOffset`,
                                  positionItem.endTimeOffset
                                );
                                setValue(
                                  `positionList.${index}.lead`,
                                  positionItem.lead
                                );
                                setValue(
                                  `positionList.${index}.details`,
                                  positionItem.details
                                );
                                setValue(
                                  `positionList.${index}.prerequisite`,
                                  positionItem.prerequisite
                                );
                                setValue(
                                  `positionList.${index}.role`,
                                  positionItem.role
                                );
                                setValue(
                                  `positionList.${index}.startTimeOffset`,
                                  positionItem.startTimeOffset
                                );
                              }
                            }}
                            required
                          >
                            {dataDefaults.positionList.map(
                              ({ positionId, name: nameDefault }) => {
                                const isPositionAvailable =
                                  watchPositionList.every(
                                    ({ name: nameCurrent }) => {
                                      return nameCurrent !== nameDefault;
                                    }
                                  );

                                return (
                                  <MenuItem
                                    disabled={!isPositionAvailable}
                                    key={positionId}
                                    value={nameDefault}
                                  >
                                    {nameDefault}
                                  </MenuItem>
                                );
                              }
                            )}
                          </Select>
                          {errors.positionList &&
                            errors.positionList[index]?.name && (
                              <FormHelperText error>
                                {errors.positionList[index]?.name?.message}
                              </FormHelperText>
                            )}
                        </FormControl>
                      )}
                      rules={{
                        required: "Position is required",
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.totalSlots`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          error={
                            errors.positionList &&
                            Boolean(errors.positionList[index]?.totalSlots)
                          }
                          fullWidth
                          helperText={
                            errors.positionList &&
                            errors.positionList[index]?.totalSlots?.message
                          }
                          label="Total slots"
                          required
                          type="number"
                          variant="standard"
                        />
                      )}
                      rules={{
                        required: "Total slots is required",
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.wapPoints`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          error={
                            errors.positionList &&
                            Boolean(errors.positionList[index]?.wapPoints)
                          }
                          fullWidth
                          helperText={
                            errors.positionList &&
                            errors.positionList[index]?.wapPoints?.message
                          }
                          label="SAP points"
                          required
                          type="number"
                          variant="standard"
                        />
                      )}
                      rules={{
                        required: "SAP points is required",
                      }}
                    />
                  </Grid>
                  <Grid
                    sx={{
                      alignItems: "flex-start",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                    size={2}
                  >
                    <IconButton
                      onClick={() => {
                        handlePositionRemove(index, item.name, item.positionId);
                        enqueueSnackbar(
                          <SnackbarText>
                            <strong>New</strong> position has been removed
                            <br />
                            Click on the <strong>Update type</strong> button to
                            finalize your changes
                          </SnackbarText>,
                          {
                            variant: "success",
                          }
                        );
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Grid>
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.role`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled
                          fullWidth
                          label="Role"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.prerequisite`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled
                          fullWidth
                          label="Prerequisite"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={3}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.startTimeOffset`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled
                          fullWidth
                          label="Start time offset (min)"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={3}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.endTimeOffset`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled
                          fullWidth
                          label="End time offset (min)"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={6}>
                    <FormGroup row>
                      <Controller
                        control={control}
                        name={`positionList.${index}.critical`}
                        render={({ field: { value, ...field } }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={value}
                                color="secondary"
                                disabled
                              />
                            }
                            label="Critical"
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name={`positionList.${index}.lead`}
                        render={({ field: { value, ...field } }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={value}
                                color="secondary"
                                disabled
                              />
                            }
                            label="Lead"
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                  <Grid size={12}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.details`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled
                          fullWidth
                          label="Details"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* times */}
      <Box
        sx={{
          mb: 3,
        }}
      >
        <Stack
          alignItems="flex-end"
          direction="row"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography component="h2" variant="h4">
            Times
          </Typography>
          <Button
            onClick={() => {
              timeAppend(structuredClone(defaultValues.timeList[0]));
              enqueueSnackbar(
                <SnackbarText>
                  <strong>New</strong> time has been added
                  <br />
                  Click on the <strong>Update type</strong> button to finalize
                  your changes
                </SnackbarText>,
                {
                  variant: "success",
                }
              );
            }}
            startIcon={<MoreTimeIcon />}
            type="button"
            variant="contained"
          >
            Add time
          </Button>
        </Stack>
        {timeFields.map((item, index) => {
          return (
            <Card
              key={item.id}
              sx={{
                mb: 1,
              }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={3}>
                    <Controller
                      control={control}
                      name={`timeList.${index}.date`}
                      render={({ field: { onChange, value } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="Date"
                            onChange={(event) => {
                              // update field
                              onChange(event);

                              if (event) {
                                clearErrors(`timeList.${index}.date`);
                              }
                            }}
                            slotProps={{
                              textField: {
                                error:
                                  errors.timeList &&
                                  Boolean(errors.timeList[index]?.date),
                                fullWidth: true,
                                helperText:
                                  errors.timeList &&
                                  errors.timeList[index]?.date?.message,
                                onBlur: (event) => {
                                  if (event.target.value === "MM/DD/YYYY") {
                                    setError(`timeList.${index}.date`, {
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
                      name={`timeList.${index}.startTime`}
                      render={({ field: { onChange, value } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            ampm={false}
                            label="Start time"
                            onChange={(event) => {
                              // update field
                              onChange(event);

                              // validate start time occurs before end time
                              const startTimeActive =
                                dayjs(event).format("HH:mm");
                              const endTimeActive = dayjs(
                                getValues(`timeList.${index}.endTime`)
                              ).format("HH:mm");

                              const dateCurrent = dayjs().format("YYYY-MM-DD");
                              const startTimeCurrent = `${dateCurrent} ${startTimeActive}`;
                              const endTimeCurrent = `${dateCurrent} ${endTimeActive}`;

                              if (event) {
                                if (
                                  dayjs(startTimeCurrent).isSameOrAfter(
                                    endTimeCurrent
                                  )
                                ) {
                                  setError(`timeList.${index}.startTime`, {
                                    type: "custom",
                                    message:
                                      "Start time must occur before end time",
                                  });
                                } else {
                                  clearErrors(`timeList.${index}.startTime`);
                                  clearErrors(`timeList.${index}.endTime`);
                                }
                              }
                            }}
                            slotProps={{
                              textField: {
                                error:
                                  errors.timeList &&
                                  Boolean(errors.timeList[index]?.startTime),
                                fullWidth: true,
                                helperText:
                                  errors.timeList &&
                                  errors.timeList[index]?.startTime?.message,
                                onBlur: (event) => {
                                  if (event.target.value === "hh:mm") {
                                    setError(`timeList.${index}.startTime`, {
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
                      name={`timeList.${index}.endTime`}
                      render={({ field: { onChange, value } }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            ampm={false}
                            label="End time"
                            onChange={(event) => {
                              // update field
                              onChange(event);

                              // validate end time occurs after start time
                              const endTimeActive =
                                dayjs(event).format("HH:mm");
                              const startTimeActive = dayjs(
                                getValues(`timeList.${index}.startTime`)
                              ).format("HH:mm");

                              const dateCurrent = dayjs().format("YYYY-MM-DD");
                              const endTimeCurrent = `${dateCurrent} ${endTimeActive}`;
                              const startTimeCurrent = `${dateCurrent} ${startTimeActive}`;

                              if (event) {
                                if (
                                  dayjs(endTimeCurrent).isSameOrBefore(
                                    startTimeCurrent
                                  )
                                ) {
                                  setError(`timeList.${index}.endTime`, {
                                    type: "custom",
                                    message:
                                      "End time must occur after start time",
                                  });
                                } else {
                                  clearErrors(`timeList.${index}.endTime`);
                                  clearErrors(`timeList.${index}.startTime`);
                                }
                              }
                            }}
                            slotProps={{
                              textField: {
                                error:
                                  errors.timeList &&
                                  Boolean(errors.timeList[index]?.endTime),
                                fullWidth: true,
                                helperText:
                                  errors.timeList &&
                                  errors.timeList[index]?.endTime?.message,
                                onBlur: (event) => {
                                  if (event.target.value === "hh:mm") {
                                    setError(`timeList.${index}.endTime`, {
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
                  <Grid
                    sx={{
                      alignItems: "flex-start",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                    size={3}
                  >
                    <IconButton
                      onClick={() => {
                        handleTimeRemove(
                          index,
                          `${formatDateName(item.date)}, ${formatTime(
                            item.startTime,
                            item.endTime
                          )}`,
                          item.timeId
                        );
                        enqueueSnackbar(
                          <SnackbarText>
                            <strong>New</strong> time has been removed
                            <br />
                            Click on the <strong>Update type</strong> button to
                            finalize your changes
                          </SnackbarText>,
                          {
                            variant: "success",
                          }
                        );
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Grid>

                  <Grid size={3}>
                    <Controller
                      control={control}
                      name={`timeList.${index}.instance`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Instance"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={9}>
                    <Controller
                      control={control}
                      name={`timeList.${index}.notes`}
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
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Box>
      <Divider sx={{ borderColor: COLOR_BURNING_MAN_BROWN, mb: 3 }} />
    </>
  );
};
