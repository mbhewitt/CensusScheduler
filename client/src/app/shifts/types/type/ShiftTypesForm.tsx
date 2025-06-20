import {
  Close as CloseIcon,
  Edit as EditIcon,
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useSnackbar } from "notistack";
import { useState } from "react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFieldArrayReplace,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import {
  IFormValues,
  IPositionAddValues,
  ITimeAddValues,
} from "@/app/shifts/types/type";
import { ShiftTypesPositionDialogAdd } from "@/app/shifts/types/type/ShiftTypesPositionDialogAdd";
import { ShiftTypesTimeDialogAdd } from "@/app/shifts/types/type/ShiftTypesTimeDialogAdd";
import { ShiftTypesTimeDialogUpdate } from "@/app/shifts/types/type/ShiftTypesTimeDialogUpdate";
import { SnackbarText } from "@/components/general/SnackbarText";
import type {
  IResShiftTypeCategoryItem,
  IResShiftTypeDefaults,
} from "@/components/types/shifts/types";
import { COLOR_BURNING_MAN_BROWN, MEAL_LIST } from "@/constants";
import { ensure } from "@/utils/ensure";
import { formatDateName, formatTime } from "@/utils/formatDateTime";

dayjs.extend(utc);

enum DialogList {
  PositionAdd,
  TimeAdd,
  TimeUpdate,
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
  positionFields: FieldArrayWithId<IFormValues, "positionList", "id">[];
  positionReplace: UseFieldArrayReplace<IFormValues, "positionList">;
  setError: UseFormSetError<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
  timeFields: FieldArrayWithId<IFormValues, "timeList", "id">[];
  timePositionListAddFields: FieldArrayWithId<
    IFormValues,
    "timeAdd.positionList",
    "id"
  >[];
  timePositionListAddReplace: UseFieldArrayReplace<
    IFormValues,
    "timeAdd.positionList"
  >;
  timeRemove: UseFieldArrayRemove;
  timeReplace: UseFieldArrayReplace<IFormValues, "timeList">;
  typeName: string;
  watch: UseFormWatch<IFormValues>;
}

// utilities
// ------------------------------------------------------------
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
export const processTimeList = (formValues: IFormValues) => {
  return formValues.timeList.map(
    ({
      date,
      endTime,
      instance,
      meal,
      notes,
      positionList,
      startTime,
      timeId,
    }) => {
      return {
        endTime: `${dayjs(date).format("YYYY-MM-DD")} ${dayjs(endTime).format("HH:mm")}`,
        instance,
        meal,
        notes,
        positionList,
        startTime: `${dayjs(date).format("YYYY-MM-DD")} ${dayjs(startTime).format("HH:mm")}`,
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
  positionAdd: {
    alias: "",
    critical: false,
    details: "",
    endTimeOffset: "",
    lead: false,
    name: "",
    positionId: 0,
    prerequisite: "",
    role: "",
    sapPoints: 1,
    slots: 1,
    startTimeOffset: "",
  },
  positionList: [],
  timeAdd: {
    date: "",
    endTime: "",
    instance: "",
    meal: "None",
    notes: "",
    positionList: [],
    startTime: "",
    timeId: 0,
  },
  timeList: [],
};
export const ShiftTypesForm = ({
  clearErrors,
  control,
  dataDefaults,
  errors,
  getValues,
  handlePositionRemove,
  handleTimeRemove,
  positionFields,
  positionReplace,
  setError,
  setValue,
  timeFields,
  timePositionListAddFields,
  timePositionListAddReplace,
  timeReplace,
  typeName,
}: IShiftTypesFormProps) => {
  // state
  // ------------------------------------------------------------
  const [dialogCurrent, setDialogCurrent] = useState<{
    dialogItem: number;
    positionItem: IPositionAddValues;
    timeItem: ITimeAddValues;
  }>({
    dialogItem: 0,
    positionItem: {
      alias: "",
      critical: false,
      details: "",
      endTimeOffset: "",
      lead: false,
      name: "",
      positionId: 0,
      prerequisite: "",
      role: "",
      sapPoints: 1,
      slots: 1,
      startTimeOffset: "",
    },
    timeItem: {
      date: "",
      endTime: "",
      instance: "",
      meal: "None",
      notes: "",
      positionList: [],
      startTime: "",
      timeId: 0,
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // ------------------------------------------------------------
  const handlePositionAdd = ({
    alias,
    name,
    positionId,
    sapPoints,
    slots,
  }: IPositionAddValues) => {
    const positionFound = dataDefaults.positionList.find(
      (positionItem) => positionItem.name === name
    );

    if (positionFound) {
      const positionFieldsMutate = structuredClone(positionFields);
      const timeFieldsMutate = structuredClone(timeFields);
      const timePositionListAddNew = structuredClone(timePositionListAddFields);

      positionFieldsMutate.push({
        ...positionFound,
        alias: "",
        id: "",
        sapPoints: 1,
        slots: 1,
      });
      positionFieldsMutate.sort((positionField1, positionField2) =>
        positionField1.name.localeCompare(positionField2.name)
      );
      positionReplace(positionFieldsMutate);

      timeFieldsMutate.forEach((timeFieldsItem) => {
        timeFieldsItem.positionList.push({
          alias,
          name,
          positionId,
          sapPoints,
          slots,
          timePositionId: 0,
        });
      });
      timeReplace(timeFieldsMutate);
      timePositionListAddNew.push({
        alias: positionFound.name,
        id: "0",
        name,
        positionId: positionFound.positionId,
        sapPoints: 1,
        slots: 1,
        timePositionId: 0,
      });
      timePositionListAddReplace(timePositionListAddNew);

      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> position has been added
        </SnackbarText>,
        {
          variant: "success",
        }
      );
    }
  };
  const handleTimeAdd = ({
    date,
    endTime,
    instance,
    meal,
    notes,
    positionList,
    startTime,
  }: ITimeAddValues) => {
    const dateNew = dayjs(date).format("YYYY-MM-DD");
    const endTimeNew = dayjs(endTime).format("HH:mm");
    const startTimeNew = dayjs(startTime).format("HH:mm");
    const timeNew = {
      date: dateNew,
      endTime: `${dateNew} ${endTimeNew}`,
      id: "",
      instance,
      meal,
      notes,
      positionList,
      startTime: `${dateNew} ${startTimeNew}`,
      timeId: 0,
    };
    const timeFieldsMutate = structuredClone(timeFields);

    timeFieldsMutate.push(timeNew);
    timeFieldsMutate.sort((timeField1, timeField2) =>
      dayjs(timeField1.startTime).isBefore(dayjs(timeField2.startTime)) ? -1 : 1
    );
    timeReplace(timeFieldsMutate);

    enqueueSnackbar(
      <SnackbarText>
        <strong>{formatDateName(date)}</strong> at{" "}
        <strong>
          {startTimeNew}-{endTimeNew}
        </strong>{" "}
        time has been added
      </SnackbarText>,
      {
        variant: "success",
      }
    );
  };
  const handleTimeUpdate = (timeItem: ITimeAddValues) => {
    const timeFieldsMutate = structuredClone(timeFields);
    const timeFieldsNew = timeFieldsMutate.map((timeFieldsItem) => {
      if (timeFieldsItem.timeId === timeItem.timeId) {
        return timeItem;
      }

      return timeFieldsItem;
    });

    timeReplace(timeFieldsNew);

    enqueueSnackbar(
      <SnackbarText>
        <strong>{formatDateName(timeItem.date)}</strong> at{" "}
        <strong>
          {`${dayjs(timeItem.startTime).format("HH:mm")}-${dayjs(timeItem.endTime).format("HH:mm")}`}
        </strong>{" "}
        time has been updated
      </SnackbarText>,
      {
        variant: "success",
      }
    );
  };

  // render
  // ------------------------------------------------------------
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
                      error={Boolean(errors.information?.name)}
                      fullWidth
                      helperText={errors.information?.name?.message}
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
                    <FormControl fullWidth required variant="standard">
                      <InputLabel id="category">Category</InputLabel>
                      <Select
                        {...field}
                        error={Boolean(errors.information?.category?.name)}
                        label="Category *"
                        labelId="category"
                      >
                        {dataDefaults.categoryList.map(
                          ({ id, name }: IResShiftTypeCategoryItem) => (
                            <MenuItem key={id} value={name}>
                              {name}
                            </MenuItem>
                          )
                        )}
                      </Select>
                      {errors.information?.category?.name && (
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
              setDialogCurrent({
                dialogItem: DialogList.PositionAdd,
                positionItem: defaultValues.positionAdd,
                timeItem: {
                  ...defaultValues.timeAdd,
                  positionList: timePositionListAddFields,
                },
              });
              setIsDialogOpen(true);
            }}
            startIcon={<GroupAddIcon />}
            type="button"
            variant="contained"
          >
            Add position
          </Button>
        </Stack>
        {positionFields.map((positionItem, positionIndex) => {
          return (
            <Card
              key={positionItem.id}
              sx={{
                mb: 1,
              }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name={`positionList.${positionIndex}.name`}
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
                  <Grid size={4}>
                    <FormGroup row>
                      <Controller
                        control={control}
                        name={`positionList.${positionIndex}.critical`}
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
                        name={`positionList.${positionIndex}.lead`}
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
                  <Grid
                    size={2}
                    sx={{
                      alignItems: "flex-start",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        handlePositionRemove(
                          positionIndex,
                          positionItem.name,
                          positionItem.positionId
                        );
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Grid>
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name={`positionList.${positionIndex}.role`}
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
                      name={`positionList.${positionIndex}.prerequisite`}
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
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name={`positionList.${positionIndex}.startTimeOffset`}
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
                  <Grid size={6}>
                    <Controller
                      control={control}
                      name={`positionList.${positionIndex}.endTimeOffset`}
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
                  <Grid size={12}>
                    <Controller
                      control={control}
                      name={`positionList.${positionIndex}.details`}
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
          sx={{ mb: 1 }}
        >
          <Typography component="h2" variant="h4">
            Times
          </Typography>
          <Button
            onClick={() => {
              setDialogCurrent({
                dialogItem: DialogList.TimeAdd,
                positionItem: defaultValues.positionAdd,
                timeItem: {
                  ...defaultValues.timeAdd,
                  positionList: timePositionListAddFields,
                },
              });
              setIsDialogOpen(true);
            }}
            startIcon={<MoreTimeIcon />}
            type="button"
            variant="contained"
          >
            Add time
          </Button>
        </Stack>
        {timeFields.map((timeItem, timeIndex) => {
          return (
            <Box key={timeItem.id} sx={{ mb: 3 }}>
              <Typography component="h3" variant="h6">
                Time
              </Typography>
              <Card
                sx={{
                  mb: 1,
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={3}>
                      <Controller
                        control={control}
                        name={`timeList.${timeIndex}.date`}
                        render={({ field: { value } }) => (
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              disabled
                              label="Date"
                              slotProps={{
                                textField: {
                                  fullWidth: true,
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
                        name={`timeList.${timeIndex}.startTime`}
                        render={({ field: { value } }) => (
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                              ampm={false}
                              disabled
                              label="Start time"
                              slotProps={{
                                textField: {
                                  fullWidth: true,
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
                        name={`timeList.${timeIndex}.endTime`}
                        render={({ field: { value } }) => (
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimePicker
                              ampm={false}
                              disabled
                              label="End time"
                              slotProps={{
                                textField: {
                                  fullWidth: true,
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
                          setDialogCurrent({
                            dialogItem: DialogList.TimeUpdate,
                            positionItem: defaultValues.positionAdd,
                            timeItem,
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          handleTimeRemove(
                            timeIndex,
                            `${formatDateName(timeItem.date)}, ${formatTime(
                              timeItem.startTime,
                              timeItem.endTime
                            )}`,
                            timeItem.timeId
                          );
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Grid>
                    <Grid size={3}>
                      <Controller
                        control={control}
                        name={`timeList.${timeIndex}.meal`}
                        render={({ field }) => (
                          <FormControl fullWidth required variant="standard">
                            <InputLabel id="meal">Meal</InputLabel>
                            <Select
                              {...field}
                              disabled
                              label="Meal *"
                              labelId="meal"
                            >
                              {MEAL_LIST.map((mealItem) => (
                                <MenuItem key={`${mealItem}`} value={mealItem}>
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
                        name={`timeList.${timeIndex}.instance`}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            disabled
                            fullWidth
                            label="Instance"
                            required
                            variant="standard"
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={12}>
                      <Controller
                        control={control}
                        name={`timeList.${timeIndex}.notes`}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            disabled
                            fullWidth
                            label="Notes"
                            multiline
                            variant="standard"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* time positions */}
              <Box sx={{ pl: 3 }}>
                <Typography component="h3" variant="h6">
                  Positions
                </Typography>
                {timeItem.positionList.map(
                  ({ timePositionId, positionId }, timePositionIndex) => {
                    return (
                      <Card
                        key={`${timePositionId}-${positionId}`}
                        sx={{
                          mb: 1,
                        }}
                      >
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid size={6}>
                              <Controller
                                control={control}
                                name={`timeList.${timeIndex}.positionList.${timePositionIndex}.name`}
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
                                name={`timeList.${timeIndex}.positionList.${timePositionIndex}.alias`}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    disabled
                                    fullWidth
                                    label="Alias"
                                    required
                                    variant="standard"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={3}>
                              <Controller
                                control={control}
                                name={`timeList.${timeIndex}.positionList.${timePositionIndex}.slots`}
                                render={({ field: { value } }) => (
                                  <TextField
                                    disabled
                                    fullWidth
                                    label="Slots"
                                    required
                                    type="number"
                                    value={value}
                                    variant="standard"
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={3}>
                              <Controller
                                control={control}
                                name={`timeList.${timeIndex}.positionList.${timePositionIndex}.sapPoints`}
                                render={({ field: { value } }) => (
                                  <TextField
                                    disabled
                                    fullWidth
                                    label="SAP points"
                                    required
                                    type="number"
                                    value={value}
                                    variant="standard"
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    );
                  }
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Divider sx={{ borderColor: COLOR_BURNING_MAN_BROWN, mb: 3 }} />

      {/* position dialog add */}
      <ShiftTypesPositionDialogAdd
        control={control}
        errors={errors}
        getValues={getValues}
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.PositionAdd && isDialogOpen
        }
        handlePositionAdd={handlePositionAdd}
        positionItem={dialogCurrent.positionItem}
        positionListDefaults={dataDefaults.positionList}
        setError={setError}
        setValue={setValue}
      />

      {/* time dialog add */}
      <ShiftTypesTimeDialogAdd
        control={control}
        clearErrors={clearErrors}
        errors={errors}
        getValues={getValues}
        handleDialogClose={() => setIsDialogOpen(false)}
        handleTimeAdd={handleTimeAdd}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.TimeAdd && isDialogOpen
        }
        setError={setError}
        setValue={setValue}
        timeItem={dialogCurrent.timeItem}
        timeFields={timeFields}
        timePositionListAddFields={timePositionListAddFields}
      />

      {/* time dialog update */}
      <ShiftTypesTimeDialogUpdate
        control={control}
        clearErrors={clearErrors}
        errors={errors}
        getValues={getValues}
        handleDialogClose={() => setIsDialogOpen(false)}
        handleTimeUpdate={handleTimeUpdate}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.TimeUpdate && isDialogOpen
        }
        setError={setError}
        setValue={setValue}
        timeItem={dialogCurrent.timeItem}
        timeFields={timeFields}
        timePositionListAddFields={timePositionListAddFields}
      />
    </>
  );
};
