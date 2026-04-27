import dayjs, { Dayjs } from "dayjs";

// format for start date time, date name, and time display
export const formatDateDB = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD");
};
export const formatDate = (date: string) => {
  return dayjs(date).format("MMM DD");
};
export const formatDateYear = (date: string) => {
  return dayjs(date).format("YYYY, MMM DD");
};
export const formatDateDay = (date: string) => {
  return dayjs(date).format("dddd");
};
export const formatDateName = (date: string, dateName?: string) => {
  return dateName ? `${formatDate(date)} - ${dateName}` : formatDate(date);
};
export const formatTime = (startTime: string, endTime: string) => {
  // Accepts either "HH:mm" or "YYYY-MM-DD HH:mm" -- if a date is present, strip it.
  const toTime = (t: string) => {
    if (!t) return t;
    const parsed = dayjs(t);
    return parsed.isValid() ? parsed.format("HH:mm") : t;
  };
  return `${toTime(startTime)} - ${toTime(endTime)}`;
};
export const formatDateTime = (dateTime?: Dayjs | null | string) => {
  return dateTime
    ? dayjs(dateTime).format("YYYY-MM-DD HH:mm")
    : dayjs().format("YYYY-MM-DD HH:mm");
};
