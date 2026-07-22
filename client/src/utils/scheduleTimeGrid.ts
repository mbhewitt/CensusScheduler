import dayjs from "dayjs";

// Shared time-grid math for the account-page schedule calendar and its
// printable version. Pure functions so the on-screen (React) view and the
// print (HTML string) view position shifts identically. (per papabear 2026-07-22)

export interface ITimeGridEvent {
  startTime: string; // ISO 8601 or "HH:mm"
  endTime: string;
}

// Minutes since midnight for the time-of-day of an ISO/`HH:mm` value.
export const minutesOfDay = (time: string): number => {
  const parsed = dayjs(time);
  return parsed.hour() * 60 + parsed.minute();
};

// Vertical axis bounds (minutes from midnight), snapped out to whole hours,
// with a sane fallback when there are no events.
export const getTimeAxis = (
  events: ITimeGridEvent[]
): { startMin: number; endMin: number } => {
  if (events.length === 0) return { startMin: 8 * 60, endMin: 18 * 60 };

  let startMin = Infinity;
  let endMin = -Infinity;
  events.forEach((event) => {
    startMin = Math.min(startMin, minutesOfDay(event.startTime));
    endMin = Math.max(endMin, minutesOfDay(event.endTime));
  });

  startMin = Math.floor(startMin / 60) * 60;
  endMin = Math.ceil(endMin / 60) * 60;
  if (endMin <= startMin) endMin = startMin + 60;

  return { startMin, endMin };
};

// Whole-hour marks (in hours, 0–24) spanning the axis, for the gutter labels
// and horizontal gridlines.
export const getHourMarks = (startMin: number, endMin: number): number[] => {
  const marks: number[] = [];
  for (let hour = startMin / 60; hour <= endMin / 60; hour += 1) {
    marks.push(hour);
  }
  return marks;
};

// e.g. 8 -> "8 AM", 13 -> "1 PM", 0 -> "12 AM".
export const formatHourLabel = (hour: number): string => {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized < 12 ? "AM" : "PM";
  const twelve = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${twelve} ${suffix}`;
};

export interface IPackedEvent<T extends ITimeGridEvent> {
  event: T;
  lane: number;
  startMin: number;
  endMin: number;
}

// Greedy lane packing: overlapping shifts on the same day are placed in
// separate side-by-side lanes instead of stacking on top of each other.
export const packDayLanes = <T extends ITimeGridEvent>(
  dayEvents: T[]
): { placed: IPackedEvent<T>[]; laneCount: number } => {
  const sorted = [...dayEvents].sort(
    (a, b) =>
      minutesOfDay(a.startTime) - minutesOfDay(b.startTime) ||
      minutesOfDay(a.endTime) - minutesOfDay(b.endTime)
  );

  const laneEnds: number[] = [];
  const placed = sorted.map((event) => {
    const startMin = minutesOfDay(event.startTime);
    const endMin = minutesOfDay(event.endTime);
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endMin);
    } else {
      laneEnds[lane] = endMin;
    }
    return { event, lane, startMin, endMin };
  });

  return { placed, laneCount: Math.max(1, laneEnds.length) };
};
