import {
  Close as CloseIcon,
  DateRange as DateRangeIcon,
  EditCalendar as EditCalendarIcon,
  MoreTime as MoreTimeIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
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
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type {
  IReqShiftTypePositionItem,
  IResPositionDropdownItem,
  IResShiftCategoryDropdownItem,
  IResShiftTypeInfoItem,
  IResShiftTypePositionItem,
  IResShiftTypeTimeItem,
} from "src/components/types";
import { COLOR_BURNING_MAN_BROWN } from "src/constants";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  information: IResShiftTypeInfoItem;
  positionList: IReqShiftTypePositionItem[];
  timeList: IResShiftTypeTimeItem[];
}

const defaultValues: IFormValues = {
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
      endTimeOffset: "",
      lead: false,
      positionDetails: "",
      positionId: 0,
      positionName: "",
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
      instance: "",
      notes: "",
      shiftTimesId: 0,
      startTime: "",
    },
  ],
};
export const ShiftTypeUpdate = () => {
  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { shiftTypeId } = router.query;
  const { data, error } = useSWR(
    isMounted ? `/api/shifts/types/${shiftTypeId}` : null,
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/types/${shiftTypeId}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    clearErrors,
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setError,
    setValue,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const {
    append: timeAppend,
    fields: timeFields,
    remove: timeRemove,
  } = useFieldArray({
    control,
    name: "timeList",
  });
  const {
    append: positionAppend,
    fields: positionFields,
    remove: positionRemove,
  } = useFieldArray({
    control,
    name: "positionList",
  });
  const { enqueueSnackbar } = useSnackbar();
  dayjs.extend(isSameOrBefore);

  // side effects
  // --------------------
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);
  useEffect(() => {
    if (data) {
      const { information, positionCurrentList, timeList } = data;

      reset({
        information,
        positionList: positionCurrentList,
        timeList,
      });
    }
  }, [data, reset]);

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const { shiftCategoryId } = data.shiftCategoryList.find(
        ({ shiftCategoryName }: { shiftCategoryName: string }) => {
          return shiftCategoryName === formValues.information.category;
        }
      );
      const positionList = formValues.positionList.map(
        ({ positionName, totalSlots, wapPoints }) => {
          const { positionId } = data.positionList.find(
            (positionItem: IResShiftTypePositionItem) => {
              return positionItem.positionName === positionName;
            }
          );

          return {
            positionId,
            totalSlots,
            wapPoints,
          };
        }
      );
      const timeList = formValues.timeList.map(
        ({ date, endTime, instance, notes, shiftTimesId, startTime }) => {
          const dateFormat = dayjs(date).format("YYYY-MM-DD");

          return {
            date: dateFormat,
            endTime: `${dateFormat} ${dayjs(endTime).format("HH:mm:ss")}`,
            instance,
            notes,
            shiftTimesId,
            startTime: `${dateFormat} ${dayjs(startTime).format("HH:mm:ss")}`,
          };
        }
      );

      // update database
      await trigger({
        body: {
          information: {
            details: formValues.information.details,
            isCore: formValues.information.isCore,
            isOffPlaya: formValues.information.isOffPlaya,
            name: formValues.information.name,
            shiftCategoryId,
          },
          positionList,
          timeList,
        },
        method: "PATCH",
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            <strong>{formValues.information.name}</strong>
          </strong>{" "}
          shift type has been updated
        </SnackbarText>,
        {
          variant: "success",
        }
      );
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

  // display
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="volunteers riding the census art car"
            fill
            priority
            src="/volunteers/account/create/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Update shift type"
      />
      <Container component="main">
        <Box component="section">
          <Breadcrumbs>
            <Link href="/shifts/types">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                  textDecoration: "underline",
                }}
              >
                <DateRangeIcon sx={{ mr: 0.5 }} />
                Shift types
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <EditCalendarIcon sx={{ mr: 0.5 }} />
              Update type
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box component="section">
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
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
                              errors.information &&
                              Boolean(errors.information.name)
                            }
                            fullWidth
                            helperText={
                              errors.information &&
                              errors.information.name?.message
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
                              return (
                                Boolean(value.trim()) || "Name is required"
                              );
                            },
                            roleNameAvailable: (value) => {
                              const isShiftNameAvailable =
                                data.shiftNameList.every(
                                  ({
                                    shiftNameText,
                                  }: {
                                    shiftNameText: string;
                                  }) => {
                                    return (
                                      shiftNameText.toLowerCase() !==
                                      value.toLowerCase()
                                    );
                                  }
                                );

                              return (
                                isShiftNameAvailable ||
                                `${value} shift has been added already`
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
                              {data.shiftCategoryList.map(
                                ({
                                  shiftCategoryId,
                                  shiftCategoryName,
                                }: IResShiftCategoryDropdownItem) => (
                                  <MenuItem
                                    key={shiftCategoryId}
                                    value={shiftCategoryName}
                                  >
                                    {shiftCategoryName}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                            {errors.information &&
                              errors.information.category && (
                                <FormHelperText error>
                                  {errors.information.category?.message}
                                </FormHelperText>
                              )}
                          </FormControl>
                        )}
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
                    positionAppend(
                      structuredClone(defaultValues.positionList[0])
                    );
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
                            name={`positionList.${index}.positionName`}
                            render={({ field }) => (
                              <FormControl fullWidth variant="standard">
                                <InputLabel id="to">Position *</InputLabel>
                                <Select
                                  {...field}
                                  error={
                                    errors.positionList &&
                                    Boolean(
                                      errors.positionList[index]?.positionName
                                    )
                                  }
                                  label="Position *"
                                  labelId="position"
                                  onChange={(event) => {
                                    const positionSelected = event.target.value;
                                    const positionItem = data.positionList.find(
                                      ({
                                        positionName,
                                      }: {
                                        positionName: string;
                                      }) => {
                                        return (
                                          positionName === positionSelected
                                        );
                                      }
                                    );

                                    // update field
                                    field.onChange(positionSelected);

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
                                      `positionList.${index}.positionDetails`,
                                      positionItem.positionDetails
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
                                  }}
                                  required
                                >
                                  {data.positionList.map(
                                    ({
                                      positionId,
                                      positionName,
                                    }: IResPositionDropdownItem) => (
                                      <MenuItem
                                        key={positionId}
                                        value={positionName}
                                      >
                                        {positionName}
                                      </MenuItem>
                                    )
                                  )}
                                </Select>
                                {errors.positionList &&
                                  errors.positionList[index]?.positionName && (
                                    <FormHelperText error>
                                      {
                                        errors.positionList[index]?.positionName
                                          ?.message
                                      }
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
                                  Boolean(
                                    errors.positionList[index]?.totalSlots
                                  )
                                }
                                fullWidth
                                helperText={
                                  errors.positionList &&
                                  errors.positionList[index]?.totalSlots
                                    ?.message
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
                            name={`positionList.${index}.positionDetails`}
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
                                      clearErrors(
                                        `timeList.${index}.startTime`
                                      );
                                    }
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      error={
                                        errors.timeList &&
                                        Boolean(
                                          errors.timeList[index]?.startTime
                                        )
                                      }
                                      fullWidth
                                      helperText={
                                        errors.timeList &&
                                        errors.timeList[index]?.startTime
                                          ?.message
                                      }
                                      onBlur={(event) => {
                                        if (!event.target.value) {
                                          setError(
                                            `timeList.${index}.startTime`,
                                            {
                                              type: "required",
                                              message: "Start time is required",
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
                                    field.onChange(event);

                                    if (event) {
                                      // validate end time occurs after start time
                                      const dateFormat = dayjs(
                                        getValues(`timeList.${index}.date`)
                                      ).format("YYYY-MM-DD");
                                      const startTimeFormat = dayjs(
                                        `${dateFormat} ${dayjs(
                                          getValues(
                                            `timeList.${index}.startTime`
                                          )
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
                                        clearErrors(
                                          `timeList.${index}.endTime`
                                        );
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
                                          setError(
                                            `timeList.${index}.endTime`,
                                            {
                                              type: "required",
                                              message: "End time is required",
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

            {/* actions */}
            <Card>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  p: 2,
                }}
              >
                <Button
                  disabled={isMutating}
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <CloseIcon />
                    )
                  }
                  onClick={() => {
                    reset(defaultValues);
                    router.push("/shifts/types");
                  }}
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
                      <EditCalendarIcon />
                    )
                  }
                  type="submit"
                  variant="contained"
                >
                  Update type
                </Button>
              </CardActions>
            </Card>
          </form>
        </Box>
      </Container>
    </>
  );
};
