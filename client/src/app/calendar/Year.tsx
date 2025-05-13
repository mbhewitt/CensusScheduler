// "use client";

import { EditCalendar as EditCalendarIcon } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Typography,
  Grid2 as Grid,
} from "@mui/material";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import useSWR from "swr";

import useSWRMutation from "swr/mutation";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface IFormValues {
  year: string;
}

const defaultValues: IFormValues = {
  year: "",
};
export const Year = () => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data: data,
    error: error,
  }: {
    data: any;
    error: Error | undefined;
  } = useSWR("/api/year", fetcherGet);
  const { isMutating, trigger } = useSWRMutation("/api/year", fetcherTrigger);

  // other hooks
  // ------------------------------------------------------------
  const {
    clearErrors,
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    console.log("formValues: ", formValues);
  };

  // render
  // ------------------------------------------------------------
  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      {/* year */}
      <Typography component="h2" sx={{ mb: 2 }} variant="h4">
        Year
      </Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Controller
                control={control}
                name="year"
                render={({ field: { value } }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Year"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "standard",
                        },
                      }}
                      value={dayjs(value)}
                      views={["year"]}
                    />
                  </LocalizationProvider>
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions
          sx={{
            justifyContent: "flex-end",
            p: 2,
          }}
        >
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
            Update year
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
