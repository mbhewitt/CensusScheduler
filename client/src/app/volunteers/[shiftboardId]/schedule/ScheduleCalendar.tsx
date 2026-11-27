"use client";

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs, { Dayjs } from "dayjs";
import Link from "next/link";
import { useEffect, useState } from "react";

// The volunteer's own shifts only (#742). Times are Pacific wall-clock strings
// parsed by dayjs exactly as the agenda does, so no timezone conversion.
export interface ICalendarShift {
  key: string;
  timeId: number;
  startTime: string;
  endTime: string;
  title: string;
  canceled: boolean;
}

type Mode = "month" | "week";
const MODE_KEY = "scheduleCalendarMode";
const DAY_FMT = "YYYY-MM-DD";

export const ScheduleCalendar = ({ shifts }: { shifts: ICalendarShift[] }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [mode, setMode] = useState<Mode | null>(null); // null = not chosen yet
  const [cursor, setCursor] = useState<Dayjs>(() => dayjs());

  // Restore the saved choice after mount (SSR-safe); otherwise week on phones.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === "month" || saved === "week") setMode(saved);
    } catch {
      /* storage disabled */
    }
  }, []);
  const activeMode: Mode = mode ?? (isPhone ? "week" : "month");
  const chooseMode = (next: Mode) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      /* storage disabled */
    }
  };

  const byDay = new Map<string, ICalendarShift[]>();
  for (const s of [...shifts].sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? "")
  )) {
    if (!s.startTime) continue;
    const k = dayjs(s.startTime).format(DAY_FMT);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }

  const unit = activeMode === "month" ? "month" : "week";
  const first = cursor.startOf(unit); // week starts Sunday
  const gridStart = first.startOf("week");
  const dayCount =
    activeMode === "week"
      ? 7
      : Math.ceil((first.day() + first.daysInMonth()) / 7) * 7;
  const days = Array.from({ length: dayCount }, (_, i) =>
    gridStart.add(i, "day")
  );
  const title =
    activeMode === "month"
      ? cursor.format("MMMM YYYY")
      : `${gridStart.format("MMM D")} – ${gridStart.add(6, "day").format("MMM D, YYYY")}`;

  const chip = (s: ICalendarShift) => (
    <Box
      key={s.key}
      component={Link}
      href={`/shifts/${s.timeId}/volunteers`}
      title={`${dayjs(s.startTime).format("HH:mm")} – ${dayjs(s.endTime).format("HH:mm")} ${s.title}`}
      sx={{
        display: "block",
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
        fontSize: "0.72rem",
        lineHeight: 1.3,
        textDecoration: s.canceled ? "line-through" : "none",
        color: theme.palette.getContrastText(
          s.canceled ? theme.palette.error.main : theme.palette.success.main
        ),
        backgroundColor: s.canceled
          ? theme.palette.error.main
          : theme.palette.success.main,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: activeMode === "month" ? "nowrap" : "normal",
      }}
    >
      {dayjs(s.startTime).format("HH:mm")} {s.title}
    </Box>
  );

  const today = dayjs().format(DAY_FMT);
  const weekNames = days.slice(0, 7).map((d) => d.format("ddd"));

  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Stack direction="row" alignItems="center">
          <IconButton
            aria-label={`Previous ${unit}`}
            onClick={() => setCursor(cursor.subtract(1, unit))}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label={`Next ${unit}`}
            onClick={() => setCursor(cursor.add(1, unit))}
          >
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" onClick={() => setCursor(dayjs())}>
            Today
          </Button>
        </Stack>
        <Typography component="h3" variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={activeMode}
          onChange={(_, v: Mode | null) => v && chooseMode(v)}
          aria-label="Calendar range"
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {activeMode === "month" && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            textAlign: "center",
            color: "text.secondary",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          {weekNames.map((n) => (
            <Box key={n}>{n}</Box>
          ))}
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            activeMode === "month" || !isPhone
              ? "repeat(7, minmax(0, 1fr))"
              : "1fr",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        {days.map((d) => {
          const k = d.format(DAY_FMT);
          const list = byDay.get(k) ?? [];
          const outside =
            activeMode === "month" && d.month() !== cursor.month();
          const shown = activeMode === "month" ? list.slice(0, 3) : list;
          return (
            <Box
              key={k}
              sx={{
                minHeight: activeMode === "month" ? 84 : isPhone ? 56 : 160,
                p: 0.5,
                minWidth: 0,
                border: `0.5px solid ${theme.palette.divider}`,
                opacity: outside ? 0.45 : 1,
                backgroundColor:
                  k === today ? theme.palette.action.hover : "transparent",
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: k === today ? 800 : 600, display: "block" }}
              >
                {activeMode === "week" ? d.format("ddd MMM D") : d.date()}
              </Typography>
              <Stack spacing={0.25}>
                {shown.map(chip)}
                {list.length > shown.length && (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      setCursor(d);
                      chooseMode("week");
                    }}
                    sx={{
                      all: "unset",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      color: "text.secondary",
                    }}
                  >
                    +{list.length - shown.length} more
                  </Box>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>
      {shifts.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          You aren&apos;t signed up for any shifts yet.
        </Typography>
      )}
    </Box>
  );
};
