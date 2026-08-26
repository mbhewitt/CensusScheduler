import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import {
  CHECK_IN_BEFORE_HOURS,
  CHECK_IN_WINDOW_AFTER_MIN,
  CHECK_IN_WINDOW_BEFORE_MIN,
  CHECK_OUT_AFTER_HOURS,
  SHIFT_DURING,
  SHIFT_FUTURE,
  SHIFT_PAST,
} from "@/constants";

interface IGetCheckInType {
  dateTime: Dayjs;
  endTime: Dayjs;
  startTime: Dayjs;
}

export const getCheckInType = ({
  dateTime,
  endTime,
  startTime,
}: IGetCheckInType) => {
  dayjs.extend(isBetween);

  // evualuate pre-shift and post-shift date and times
  const shiftPre = startTime.subtract(CHECK_IN_BEFORE_HOURS, "hour");
  const shiftPost = endTime.add(CHECK_OUT_AFTER_HOURS, "hour");

  // evaluate if the current date and time is before, during, or after the shift
  if (dateTime.isBefore(shiftPre)) return SHIFT_FUTURE;
  if (dateTime.isBetween(shiftPre, shiftPost)) return SHIFT_DURING;
  return SHIFT_PAST;
};

// No-login (walk-up) check-in window: [start - BEFORE_MIN, start + AFTER_MIN],
// inclusive, keyed off the shift START (not end). The server enforces the same
// window authoritatively; this mirrors it so the UI only offers the toggle when
// a no-login check-in would actually succeed.
export const isCheckInWindowOpen = (startTime: Dayjs, now: Dayjs): boolean => {
  const open = startTime.subtract(CHECK_IN_WINDOW_BEFORE_MIN, "minute");
  const close = startTime.add(CHECK_IN_WINDOW_AFTER_MIN, "minute");
  return !now.isBefore(open) && !now.isAfter(close);
};
