import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Dayjs } from "dayjs";
import { useContext } from "react";

import { DEVELOPER_MODE_SET } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";

export const DateTime = () => {
  const {
    developerModeDispatch,
    developerModeState: {
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        ampm={false}
        label="Date and time"
        onChange={(dateTime) => {
          developerModeDispatch({
            payload: {
              dateTime: {
                isEnabled: true,
                value: dateTime as Dayjs,
              },
            },
            type: DEVELOPER_MODE_SET,
          });
        }}
        renderInput={(props) => <TextField {...props} variant="standard" />}
        value={dateTimeValue}
      />
    </LocalizationProvider>
  );
};
