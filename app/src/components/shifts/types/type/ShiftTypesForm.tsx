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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
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

import type {
  IResShiftTypeCategoryItem,
  IResShiftTypeDefaults,
} from "src/components/types/shifts/types";
import { COLOR_BURNING_MAN_BROWN } from "src/constants";
import { ensure } from "src/utils/ensure";
import {
  dateTimeZone,
  formatDateName,
  formatTime,
} from "src/utils/formatDateTime";

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
    instance: string;
    notes: string;
    startDateTime: string;
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
export const findCategoryId = (
  dataDefaults: IResShiftTypeDefaults,
  formValues: IFormValues
) => {
  const categoryIdFound = ensure(
    dataDefaults.categoryList.find(({ name }) => {
      return name === formValues.information.category.name;
    })
  ).id;

  return categoryIdFound;
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
    ({ endTime, instance, notes, startDateTime, timeId }) => {
      return {
        endTime: dateTimeZone(endTime, true).format("YYYY-MM-DD HH:mm:ss"),
        instance,
        notes,
        startDateTime: dateTimeZone(startDateTime, true).format(
          "YYYY-MM-DD HH:mm:ss"
        ),
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
      instance: "",
      notes: "",
      startDateTime: "",
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
              <Grid item xs={6}>
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
              <Grid item xs={6}>
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
              <Grid item xs={6}>
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
              <Grid item xs={6}>
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
                  <Grid item xs={6}>
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
                  <Grid item xs={2}>
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
                  <Grid item xs={2}>
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
                          label="WAP points"
                          required
                          type="number"
                          variant="standard"
                        />
                      )}
                      rules={{
                        required: "WAP points is required",
                      }}
                    />
                  </Grid>
                  <Grid
                    item
                    sx={{
                      alignItems: "flex-start",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                    xs={2}
                  >
                    <IconButton
                      onClick={() =>
                        handlePositionRemove(index, item.name, item.positionId)
                      }
                    >
                      <CloseIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={6}>
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
                  <Grid item xs={6}>
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
                  <Grid item xs={3}>
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
                  <Grid item xs={3}>
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
                  <Grid item xs={6}>
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
                  <Grid item xs={12}>
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
                  <Grid item xs={3}>
                    <Controller
                      control={control}
                      name={`timeList.${index}.startDateTime`}
                      render={({ field }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DateTimePicker
                            {...field}
                            ampm={false}
                            label="Start date and time"
                            onChange={(event) => {
                              // update field
                              field.onChange(event);

                              if (event) {
                                clearErrors(`timeList.${index}.startDateTime`);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                error={
                                  errors.timeList &&
                                  Boolean(errors.timeList[index]?.startDateTime)
                                }
                                fullWidth
                                helperText={
                                  errors.timeList &&
                                  errors.timeList[index]?.startDateTime?.message
                                }
                                onBlur={(event) => {
                                  if (!event.target.value) {
                                    setError(
                                      `timeList.${index}.startDateTime`,
                                      {
                                        type: "required",
                                        message:
                                          "Start date and time is required",
                                      }
                                    );
                                  }
                                }}
                                required
                                variant="standard"
                              />
                            )}
                          />
                        </LocalizationProvider>
                      )}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Controller
                      control={control}
                      name={`timeList.${index}.endTime`}
                      render={({ field }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            {...field}
                            ampm={false}
                            label="End time"
                            onChange={(event) => {
                              // update field
                              const startDateTime = dayjs(
                                getValues(`timeList.${index}.startDateTime`)
                              );
                              const endTimeNew = dayjs(event)
                                .set("year", startDateTime.year())
                                .set("month", startDateTime.month())
                                .set("date", startDateTime.date());

                              field.onChange(endTimeNew);

                              // validate end time occurs after start time
                              if (event) {
                                if (endTimeNew.isSameOrBefore(startDateTime)) {
                                  setError(`timeList.${index}.endTime`, {
                                    type: "custom",
                                    message:
                                      "End time must occur after start time",
                                  });
                                } else {
                                  clearErrors(`timeList.${index}.endTime`);
                                }
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                error={
                                  errors.timeList &&
                                  Boolean(errors.timeList[index]?.endTime)
                                }
                                fullWidth
                                helperText={
                                  errors.timeList &&
                                  errors.timeList[index]?.endTime?.message
                                }
                                onBlur={(event) => {
                                  if (!event.target.value) {
                                    setError(`timeList.${index}.endTime`, {
                                      type: "required",
                                      message: "End time is required",
                                    });
                                  }
                                }}
                                required
                                variant="standard"
                              />
                            )}
                          />
                        </LocalizationProvider>
                      )}
                    />
                  </Grid>
                  <Grid item xs={3}>
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
                  <Grid
                    item
                    sx={{
                      alignItems: "flex-start",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                    xs={3}
                  >
                    <IconButton
                      onClick={() => {
                        handleTimeRemove(
                          index,
                          `${formatDateName(item.startDateTime)}, ${formatTime(
                            item.startDateTime,
                            item.endTime
                          )}`,
                          item.timeId
                        );
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={12}>
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
