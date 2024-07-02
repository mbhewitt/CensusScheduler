import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(timezone);
dayjs.extend(utc);

// convert to black rock city time zone
const brcTimeZone = "America/Los_Angeles";
export const dateTimeZone = (dateTime?: Dayjs | null | string) => {
  return dateTime
    ? dayjs(dateTime).tz(brcTimeZone)
    : dayjs().tz(brcTimeZone, true);
};

// format for start date time, date name, and time display
const dateFormat = (startDateTime: string) => {
  return dateTimeZone(startDateTime).format("MMM DD");
};
export const formatDateName = (startDateTime: string, dateName?: string) => {
  return dateName
    ? `${dateFormat(startDateTime)} - ${dateName}`
    : dateFormat(startDateTime);
};
export const formatTime = (dateTimeStart: string, dateTimeEnd: string) => {
  return `${dateTimeZone(dateTimeStart).format("HH:mm")} - ${dateTimeZone(
    dateTimeEnd
  ).format("HH:mm")}`;
};
