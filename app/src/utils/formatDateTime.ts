import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(timezone);
dayjs.extend(utc);

// convert to black rock city timezone
const brcTimezone = "America/Los_Angeles";
export const dateTimezone = (dateTime?: Dayjs | null | string) => {
  return dateTime
    ? dayjs(dateTime).tz(brcTimezone)
    : dayjs().tz(brcTimezone, true);
};

// format for date, datename, and time display
const dateFormat = (dateTime: string) => {
  return dateTimezone(dateTime).format("MMM DD");
};
export const formatDateName = (date: string, dateName?: string) => {
  return dateName ? `${dateFormat(date)} - ${dateName}` : dateFormat(date);
};
export const formatTime = (dateTimeStart: string, dateTimeEnd: string) => {
  return `${dateTimezone(dateTimeStart).format("HH:mm")} - ${dateTimezone(
    dateTimeEnd
  ).format("HH:mm")}`;
};
