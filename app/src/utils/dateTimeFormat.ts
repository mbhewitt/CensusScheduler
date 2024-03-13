import dayjs from "dayjs";

export const dateFormat = (dateTime: string) => {
  return dayjs(dateTime).format("MMM DD");
};
export const dateNameFormat = (date: string, dateName: null | string) => {
  return dateName ? `${dateFormat(date)} - ${dateName}` : dateFormat(date);
};
export const timeFormat = (dateTimeStart: string, dateTimeEnd: string) => {
  return `${dayjs(dateTimeStart).format("HH:mm")} - ${dayjs(dateTimeEnd).format(
    "HH:mm"
  )}`;
};
