import {
  CalendarMonth as CalendarMonthIcon,
  Close as CloseIcon,
  EventAvailable as EventAvailableIcon,
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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
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
  IResPositionDropdownItem,
  IResShiftCategoryDropdownItem,
} from "src/components/types";
import { COLOR_BURNING_MAN_BROWN } from "src/constants";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IInformation {
  category: string;
  details: string;
  isCore: boolean;
  isOffPlaya: boolean;
  name: string;
}
interface IPositionItem {
  critical: boolean;
  endTimeOffset: string;
  lead: boolean;
  positionDetails: string;
  positionName: string;
  prerequisiteShift: string;
  role: string;
  startTimeOffset: string;
  totalSlots: string;
  wapPoints: string;
}
interface ITimeItem {
  date: string;
  endTime: string;
  instance: string;
  notes: string;
  startTime: string;
}
interface IFormValues {
  information: IInformation;
  positionList: IPositionItem[];
  timeList: ITimeItem[];
}
const defaultValues: IFormValues = {
  information: {
    category: "",
    details: "",
    isCore: false,
    isOffPlaya: false,
    name: "",
  },
  timeList: [
    {
      date: "",
      endTime: "",
      instance: "",
      notes: "",
      startTime: "",
    },
  ],
  positionList: [
    {
      critical: false,
      endTimeOffset: "",
      lead: false,
      positionDetails: "",
      positionName: "",
      prerequisiteShift: "",
      role: "",
      startTimeOffset: "",
      totalSlots: "",
      wapPoints: "",
    },
  ],
};
export const CreateShift = () => {
  // context
  // --------------------

  // state
  // --------------------

  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/shifts/create", fetcherGet);
  const { isMutating, trigger } = useSWRMutation("/api/shifts", fetcherTrigger);

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
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // form submission
  // --------------------
  // const onSubmit: SubmitHandler<IVolunteerAccountFormValues> = async (
  //   dataFormInitial
  // ) => {
  //   // trim whitespace
  //   const dataFormFinal: IVolunteerAccountFormValues = Object.keys(
  //     dataFormInitial
  //   ).reduce((dataFormAcc, dataFormKey) => {
  //     return {
  //       ...dataFormAcc,
  //       [dataFormKey]:
  //         dataFormInitial[
  //           dataFormKey as keyof IVolunteerAccountFormValues
  //         ]?.trim(),
  //     };
  //   }, {});

  //   try {
  //     // MoreTime database
  //     const { data: dataVolunteerItem }: { data: IResVolunteerAccount } =
  //       await trigger({
  //         body: dataFormFinal,
  //         method: "POST",
  //       });

  //     sessionDispatch({
  //       payload: dataVolunteerItem,
  //       type: SESSION_SIGN_IN,
  //     });
  //     reset(defaultValues);
  //     enqueueSnackbar(
  //       <SnackbarText>
  //         Account for{" "}
  //         <strong>
  //           {dataVolunteerItem.playaName} &quot;{dataVolunteerItem.worldName}
  //           &quot;
  //         </strong>{" "}
  //         has been created
  //       </SnackbarText>,
  //       {
  //         variant: "success",
  //       }
  //     );
  //     router.push(`/account/${dataVolunteerItem.shiftboardId}`);
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       enqueueSnackbar(
  //         <SnackbarText>
  //           <strong>{error.message}</strong>
  //         </SnackbarText>,
  //         {
  //           persist: true,
  //           variant: "error",
  //         }
  //       );
  //     }

  //     throw error;
  //   }
  // };
  const onSubmit: SubmitHandler<IFormValues> = (formValues) => {
    console.log("formValues: ", formValues);
    const isShiftNameAvailable = data.shiftNameList.every(
      ({ shiftNameText }: { shiftNameText: string }) => {
        return (
          shiftNameText.toLowerCase() !==
          formValues.information.name.toLowerCase()
        );
      }
    );
    const invalidTimeFound = formValues.timeList.find(
      ({ endTime, startTime }: { endTime: string; startTime: string }) => {
        return dayjs(endTime).isBefore(dayjs(startTime));
      }
    );

    // if the shift name has been added already
    // then display error
    if (!isShiftNameAvailable) {
      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.information.name}</strong> shift name has been
          added already
        </SnackbarText>,
        {
          persist: true,
          variant: "error",
        }
      );
    }

    // if shift end time occurs before start time
    // then display error
    if (invalidTimeFound) {
      enqueueSnackbar(
        <SnackbarText>
          On{" "}
          <strong>{dayjs(invalidTimeFound.date).format("MM/DD/YYYY")}</strong>,
          the <strong>end time</strong> is occuring before the{" "}
          <strong>start time</strong>
        </SnackbarText>,
        {
          persist: true,
          variant: "error",
        }
      );
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
            src="/create-account/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Create shift"
      />
      <Container component="main">
        <Box component="section">
          <Breadcrumbs>
            <Link href="/shifts">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                  textDecoration: "underline",
                }}
              >
                <CalendarMonthIcon sx={{ mr: 0.5 }} />
                Shifts
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <EventAvailableIcon sx={{ mr: 0.5 }} />
              Create shift
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
                          validate: (value) => {
                            return Boolean(value.trim()) || "Name is required";
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
                                      clearErrors(`timeList.${index}.endTime`);
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
                    router.push("/shifts");
                  }}
                  type="button"
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isMutating}
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <EventAvailableIcon />
                    )
                  }
                  type="submit"
                  variant="contained"
                >
                  Create shift
                </Button>
              </CardActions>
            </Card>
          </form>
        </Box>
      </Container>
    </>
  );
};
