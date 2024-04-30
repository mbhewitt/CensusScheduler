import {
  Close as CloseIcon,
  MoreTime as MoreTimeIcon,
  PersonAdd as PersonAddIcon,
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
import { TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useRouter } from "next/router";
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
} from "react-hook-form";

import type {
  IReqShiftTypePositionItem,
  IResShiftTypeCategoryItem,
  IResShiftTypeInformation,
  IResShiftTypeItem,
  IResShiftTypePositionItem,
  IResShiftTypeTimeItem,
} from "src/components/types";
import { COLOR_BURNING_MAN_BROWN } from "src/constants";

export interface IFormValues {
  information: IResShiftTypeInformation;
  positionList: IReqShiftTypePositionItem[];
  timeList: IResShiftTypeTimeItem[];
}
interface IDataDefaults {
  categoryList: IResShiftTypeCategoryItem[];
  positionList: IResShiftTypePositionItem[];
  typeList: IResShiftTypeItem[];
}
interface IShiftTypeFormProps {
  clearErrors: UseFormClearErrors<IFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  dataDefaults: IDataDefaults;
  errors: FieldErrors<IFormValues>;
  getValues: UseFormGetValues<IFormValues>;
  positionAppend: UseFieldArrayAppend<IFormValues, "positionList">;
  positionFields: FieldArrayWithId<IFormValues, "positionList", "id">[];
  positionRemove: UseFieldArrayRemove;
  setError: UseFormSetError<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
  timeAppend: UseFieldArrayAppend<IFormValues, "timeList">;
  timeFields: FieldArrayWithId<IFormValues, "timeList", "id">[];
  timeRemove: UseFieldArrayRemove;
}

// utilities
// --------------------
export const findCategoryId = (
  dataDefaults: IDataDefaults,
  formValues: IFormValues
) => {
  const categoryItem = dataDefaults.categoryList.find(
    ({ name }: { name: string }) => {
      return name === formValues.information.category;
    }
  );

  return categoryItem?.id;
};
export const processPositionList = (
  dataDefaults: IDataDefaults,
  formValues: IFormValues
) => {
  return formValues.positionList.map(({ name, totalSlots, wapPoints }) => {
    const positionFound = dataDefaults.positionList.find(
      (positionItem: IResShiftTypePositionItem) => {
        return positionItem.name === name;
      }
    );

    return {
      positionTypeId: positionFound?.positionTypeId,
      totalSlots,
      wapPoints,
    };
  });
};
export const processTimeList = (formValues: IFormValues) => {
  return formValues.timeList.map(
    ({ date, endTime, id, instance, notes, startTime }) => {
      const dateFormat = dayjs(date).format("YYYY-MM-DD");

      return {
        date: dateFormat,
        endTime: `${dateFormat} ${dayjs(endTime).format("HH:mm:ss")}`,
        id,
        instance,
        notes,
        startTime: `${dateFormat} ${dayjs(startTime).format("HH:mm:ss")}`,
      };
    }
  );
};

export const defaultValues: IFormValues = {
  information: {
    category: "",
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
      positionTypeId: 0,
      prerequisiteShift: "",
      role: "",
      startTimeOffset: "",
      totalSlots: "",
      wapPoints: "",
    },
  ],
  timeList: [
    {
      date: "",
      endTime: "",
      id: 0,
      instance: "",
      notes: "",
      startTime: "",
    },
  ],
};
export const ShiftTypeForm = ({
  clearErrors,
  control,
  dataDefaults,
  errors,
  getValues,
  positionAppend,
  positionFields,
  positionRemove,
  setError,
  setValue,
  timeAppend,
  timeFields,
  timeRemove,
}: IShiftTypeFormProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { shiftTypeId } = router.query;

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
                      typeAvailable: (value) => {
                        const nameFound = dataDefaults.typeList.find(
                          ({ id }) => id === Number(shiftTypeId)
                        )?.name;
                        const isTypeAvailable =
                          value === nameFound ||
                          dataDefaults.typeList.every(({ name }) => {
                            return name.toLowerCase() !== value.toLowerCase();
                          });

                        return (
                          isTypeAvailable ||
                          `${value} shift type has been added already`
                        );
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  control={control}
                  name="information.category"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="to">Category *</InputLabel>
                      <Select
                        {...field}
                        error={
                          errors.information &&
                          Boolean(errors.information.category)
                        }
                        label="Category"
                        labelId="category"
                        required
                      >
                        {dataDefaults.categoryList.map(
                          ({
                            id: shiftTypeCategoryId,
                            name: shiftTypeCategoryName,
                          }: IResShiftTypeCategoryItem) => (
                            <MenuItem
                              key={shiftTypeCategoryId}
                              value={shiftTypeCategoryName}
                            >
                              {shiftTypeCategoryName}
                            </MenuItem>
                          )
                        )}
                      </Select>
                      {errors.information && errors.information.category && (
                        <FormHelperText error>
                          {errors.information.category?.message}
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
            startIcon={<PersonAddIcon />}
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
                  <Grid item xs={3}>
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
                                  `positionList.${index}.prerequisiteShift`,
                                  positionItem.prerequisiteShift
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
                              ({ positionTypeId, name }) => (
                                <MenuItem key={positionTypeId} value={name}>
                                  {name}
                                </MenuItem>
                              )
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
                  <Grid item xs={3}>
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
                  <Grid item xs={3}>
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
                    xs={3}
                  >
                    <IconButton onClick={() => positionRemove(index)}>
                      <CloseIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={3}>
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
                  <Grid item xs={3}>
                    <Controller
                      control={control}
                      name={`positionList.${index}.prerequisiteShift`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled
                          fullWidth
                          label="Prerequisite shift"
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
                          label="Start time offset"
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
                          label="End time offset"
                          variant="standard"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
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
                      name={`timeList.${index}.date`}
                      render={({ field }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            {...field}
                            label="Date"
                            onChange={(event) => {
                              // update field
                              field.onChange(event);

                              if (event) {
                                clearErrors(`timeList.${index}.date`);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                error={
                                  errors.timeList &&
                                  Boolean(errors.timeList[index]?.date)
                                }
                                fullWidth
                                helperText={
                                  errors.timeList &&
                                  errors.timeList[index]?.date?.message
                                }
                                required
                                onBlur={(event) => {
                                  if (!event.target.value) {
                                    setError(`timeList.${index}.date`, {
                                      type: "required",
                                      message: "Date is required",
                                    });
                                  }
                                }}
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
                      name={`timeList.${index}.startTime`}
                      render={({ field }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            {...field}
                            ampm={false}
                            label="Start time"
                            onChange={(event) => {
                              // update field
                              field.onChange(event);

                              if (event) {
                                clearErrors(`timeList.${index}.startTime`);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                error={
                                  errors.timeList &&
                                  Boolean(errors.timeList[index]?.startTime)
                                }
                                fullWidth
                                helperText={
                                  errors.timeList &&
                                  errors.timeList[index]?.startTime?.message
                                }
                                onBlur={(event) => {
                                  if (!event.target.value) {
                                    setError(`timeList.${index}.startTime`, {
                                      type: "required",
                                      message: "Start time is required",
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
                      name={`timeList.${index}.endTime`}
                      render={({ field }) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <TimePicker
                            {...field}
                            ampm={false}
                            label="End time"
                            onChange={(event) => {
                              // update field
                              field.onChange(event);

                              if (event) {
                                // validate end time occurs after start time
                                const dateFormat = dayjs(
                                  getValues(`timeList.${index}.date`)
                                ).format("YYYY-MM-DD");
                                const startTimeFormat = dayjs(
                                  `${dateFormat} ${dayjs(
                                    getValues(`timeList.${index}.startTime`)
                                  ).format("HH:mm")}`
                                );
                                const endTimeFormat = dayjs(
                                  `${dateFormat} ${dayjs(event).format(
                                    "HH:mm"
                                  )}`
                                );

                                if (
                                  dayjs(endTimeFormat).isSameOrBefore(
                                    startTimeFormat
                                  )
                                ) {
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
                  <Grid
                    item
                    sx={{
                      alignItems: "flex-start",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                    xs={3}
                  >
                    <IconButton onClick={() => timeRemove(index)}>
                      <CloseIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={6}>
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
                  <Grid item xs={6}>
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
