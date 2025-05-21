import { Grid2 as Grid, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { IResDateRowItem } from "@/components/types/calendar/dates";

export interface IFormValues {
  date: string;
  name: string;
}
interface IDatesDialogFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  dateName: string;
  dateList: IResDateRowItem[];
}

export const defaultValues: IFormValues = {
  date: "",
  name: "",
};
export const DatesDialogForm = ({
  control,
  errors,
  dateName,
  dateList,
}: IDatesDialogFormProps) => {
  // render
  // ------------------------------------------------------------
  return (
    <Grid container spacing={2}>
      <Grid size={6}>
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date"
                onChange={(event) => {
                  // update field
                  onChange(event);
                }}
                slotProps={{
                  textField: {
                    error: Boolean(errors.date),
                    fullWidth: true,
                    helperText: errors.date?.message,
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
      <Grid size={6}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
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
              dateNameAvailable: (value) => {
                const isDateNameAvailable =
                  value === dateName ||
                  dateList.every(({ name }) => name !== value);

                return (
                  isDateNameAvailable || `${value} date has been added already`
                );
              },
            },
          }}
        />
      </Grid>
    </Grid>
  );
};
