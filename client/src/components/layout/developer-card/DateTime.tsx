import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useContext } from "react";

import { DEVELOPER_MODE_DATE_TIME } from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { formatDateTime } from "@/utils/formatDateTime";

export const DateTime = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeDispatch,
    developerModeState: {
      dateTime: { value },
    },
  } = useContext(DeveloperModeContext);

  // render
  // ------------------------------------------------------------
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        ampm={false}
        label="Date and time"
        onChange={(dateTime) => {
          developerModeDispatch({
            payload: {
              isEnabled: true,
              value: formatDateTime(dateTime),
            },
            type: DEVELOPER_MODE_DATE_TIME,
          });
        }}
        slotProps={{
          textField: {
            variant: "standard",
          },
        }}
        value={dayjs(value)}
      />
    </LocalizationProvider>
  );
};
