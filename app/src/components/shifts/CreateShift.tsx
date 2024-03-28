import {
  CalendarMonth as CalendarMonthIcon,
  Close as CloseIcon,
  EventAvailable as EventAvailableIcon,
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
  FormControl,
  FormControlLabel,
  FormGroup,
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
import { Controller, SubmitHandler, useForm } from "react-hook-form";
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
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  category: string;
  date: string;
  details: string;
  endTime: string;
  instance: string;
  isCore: boolean;
  isOffPlaya: boolean;
  name: string;
  notes: string;
  position: string;
  startTime: string;
  totalSlots: number;
  wapPoints: number;
}
const defaultValues: IFormValues = {
  category: "",
  date: "",
  details: "",
  endTime: "",
  instance: "",
  isCore: false,
  isOffPlaya: false,
  name: "",
  notes: "",
  position: "",
  startTime: "",
  totalSlots: 0,
  wapPoints: 0,
};
export const CreateShift = () => {
  // context
  // --------------------

  // state
  // --------------------

  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/shifts/dropdown", fetcherGet);
  const { isMutating, trigger } = useSWRMutation("/api/shifts", fetcherTrigger);

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
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
  //     // update database
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
            <Card
              sx={{
                mb: 2,
              }}
            >
              <CardContent>
                {/* handle errors */}
                {Object.keys(errors).length > 0 && (
                  <ErrorForm errors={errors} />
                )}

                <Stack direction="row" spacing={2}>
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
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Controller
                    control={control}
                    name="details"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Details"
                        sx={{ width: 0.5 }}
                        variant="standard"
                      />
                    )}
                  />
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
                </Stack>
              </CardContent>
            </Card>
            <Card
              sx={{
                mb: 2,
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <Controller
                    control={control}
                    name="position"
                    render={({ field }) => (
                      <FormControl fullWidth variant="standard">
                        <InputLabel id="to">Position *</InputLabel>
                        <Select
                          {...field}
                          label="Position *"
                          labelId="position"
                          required
                        >
                          {data.positionList.map(
                            ({
                              positionId,
                              positionName,
                            }: IResPositionDropdownItem) => (
                              <MenuItem key={positionId} value={positionName}>
                                {positionName}
                              </MenuItem>
                            )
                          )}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <Controller
                    control={control}
                    name="totalSlots"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Total slots"
                        variant="standard"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="wapPoints"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="WAP points"
                        variant="standard"
                      />
                    )}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    disabled
                    fullWidth
                    label="Role"
                    variant="standard"
                  />
                  <TextField
                    disabled
                    fullWidth
                    label="Prerequisite shift"
                    variant="standard"
                  />
                  <TextField
                    disabled
                    fullWidth
                    label="Start time offset"
                    variant="standard"
                  />
                  <TextField
                    disabled
                    fullWidth
                    label="End time offset"
                    variant="standard"
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    disabled
                    fullWidth
                    label="Details"
                    sx={{ width: 0.5 }}
                    variant="standard"
                  />
                  <FormGroup row>
                    <FormControlLabel
                      control={<Checkbox color="secondary" disabled />}
                      label="Critical"
                    />
                    <FormControlLabel
                      control={<Checkbox color="secondary" disabled />}
                      label="Lead"
                    />
                  </FormGroup>
                </Stack>
              </CardContent>
            </Card>
            <Card
              sx={{
                mb: 2,
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <Controller
                    control={control}
                    name="date"
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
                  <Controller
                    control={control}
                    name="startTime"
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
                        return Boolean(value) || "Start time is required";
                      },
                    }}
                  />
                  <Controller
                    control={control}
                    name="endTime"
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
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Notes"
                        variant="standard"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="instance"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Instance"
                        variant="standard"
                      />
                    )}
                  />
                </Stack>
              </CardContent>
            </Card>
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
