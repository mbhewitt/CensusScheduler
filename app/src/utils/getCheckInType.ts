import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import {
  CHECK_IN_BEFORE_HOURS,
  CHECK_OUT_AFTER_HOURS,
  SHIFT_DURING,
  SHIFT_FUTURE,
  SHIFT_PAST,
} from "src/constants";

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
