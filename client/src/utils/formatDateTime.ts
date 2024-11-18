import dayjs, { Dayjs } from "dayjs";

// format for start date time, date name, and time display
const formatDate = (startDateTime: string) => {
  return dayjs(startDateTime).format("MMM DD");
};
export const formatDateName = (startDateTime: string, dateName?: string) => {
  return dateName
    ? `${formatDate(startDateTime)} - ${dateName}`
    : formatDate(startDateTime);
};
export const formatTime = (dateTimeStart: string, dateTimeEnd: string) => {
  return `${dayjs(dateTimeStart).format("HH:mm")} - ${dayjs(dateTimeEnd).format(
    "HH:mm"
  )}`;
};
export const formatDateTime = (dateTime?: Dayjs | null | string) => {
  return dateTime
    ? dayjs(dateTime).format("YYYY-MM-DD HH:mm")
    : dayjs().format("YYYY-MM-DD HH:mm");
};
