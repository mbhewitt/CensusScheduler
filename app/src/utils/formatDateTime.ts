import dayjs from "dayjs";

const dateFormat = (dateTime: string) => {
  return dayjs(dateTime).format("MMM DD");
};
export const formatDateName = (date: string, dateName: null | string) => {
  return dateName ? `${dateFormat(date)} - ${dateName}` : dateFormat(date);
};
export const formatTime = (dateTimeStart: string, dateTimeEnd: string) => {
  return `${dayjs(dateTimeStart).format("HH:mm")} - ${dayjs(dateTimeEnd).format(
    "HH:mm"
  )}`;
};
