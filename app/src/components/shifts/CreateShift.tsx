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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
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

import { ErrorForm } from "src/components/general/ErrorForm";
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
  category: string;
  details: string;
  isCore: boolean;
  isOffPlaya: boolean;
  name: string;
  positionList: IPositionItem[];
  timeList: ITimeItem[];
}
const defaultValues: IFormValues = {
  category: "",
  timeList: [
    {
      date: "",
      endTime: "",
      instance: "",
      notes: "",
      startTime: "",
    },
  ],
  details: "",
  isCore: false,
  isOffPlaya: false,
  name: "",
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
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
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
  const theme = useTheme();

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
  const onSubmit: SubmitHandler<IFormValues> = (dataFormInitial) => {
    console.log("dataFormInitial: ", dataFormInitial);
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
                  {/* handle errors */}
                  {Object.keys(errors).length > 0 && (
                    <ErrorForm errors={errors} />
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Controller
                        control={control}
                        name="name"
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Name"
                            required
                            variant="standard"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <FormControl fullWidth variant="standard">
                            <InputLabel id="to">Category *</InputLabel>
                            <Select
                              {...field}
                              label="Category *"
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
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        control={control}
                        name="details"
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
                          name="isCore"
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
                          name="isOffPlaya"
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

                                    field.onChange(positionSelected);
                                    setValue(
                                      `positionList.${index}.role`,
                                      positionItem.role
                                    );
                                    setValue(
                                      `positionList.${index}.prerequisiteShift`,
                                      positionItem.prerequisiteShift
                                    );
                                    setValue(
                                      `positionList.${index}.startTimeOffset`,
                                      positionItem.startTimeOffset
                                    );
                                    setValue(
                                      `positionList.${index}.endTimeOffset`,
                                      positionItem.endTimeOffset
                                    );
                                    setValue(
                                      `positionList.${index}.positionDetails`,
                                      positionItem.positionDetails
                                    );
                                    setValue(
                                      `positionList.${index}.critical`,
                                      positionItem.critical
                                    );
                                    setValue(
                                      `positionList.${index}.lead`,
                                      positionItem.lead
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
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Controller
                            control={control}
                            name={`positionList.${index}.totalSlots`}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Total slots"
                                required
                                type="number"
                                variant="standard"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Controller
                            control={control}
                            name={`positionList.${index}.wapPoints`}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="WAP points"
                                required
                                type="number"
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
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      error={Object.hasOwn(errors, "date")}
                                      fullWidth
                                      // helperText={errors.date?.message}
                                      required
                                      variant="standard"
                                    />
                                  )}
                                />
                              </LocalizationProvider>
                            )}
                            rules={{
                              required: "Date is required",
                              validate: (value) => {
                                return Boolean(value) || "Date is required";
                              },
                            }}
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
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      error={Object.hasOwn(errors, "startTime")}
                                      fullWidth
                                      // helperText={errors.startTime?.message}
                                      required
                                      variant="standard"
                                    />
                                  )}
                                />
                              </LocalizationProvider>
                            )}
                            rules={{
                              required: "Start time is required",
                              validate: (value) => {
                                return (
                                  Boolean(value) || "Start time is required"
                                );
                              },
                            }}
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
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      error={Object.hasOwn(errors, "endTime")}
                                      fullWidth
                                      // helperText={errors.endTime?.message}
                                      required
                                      variant="standard"
                                    />
                                  )}
                                />
                              </LocalizationProvider>
                            )}
                            rules={{
                              required: "End time is required",
                              validate: (value) => {
                                return Boolean(value) || "End time is required";
                              },
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
