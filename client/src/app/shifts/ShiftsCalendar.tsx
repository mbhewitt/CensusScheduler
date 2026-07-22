"use client";

import {
  CheckBox as CheckBoxIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { lighten, useTheme } from "@mui/material/styles";
import dayjs, { Dayjs } from "dayjs";

import { formatTime } from "@/utils/formatDateTime";
import {
  formatHourLabel,
  getHourMarks,
  getTimeAxis,
  packDayLanes,
} from "@/utils/scheduleTimeGrid";
import { shiftBadge } from "@/utils/shiftBadge";

export interface ICalendarEvent {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  type: string;
  filled: number;
  total: number;
  canceled: boolean;
  eligible: boolean;
  isMine: boolean;
  lockedReason: string;
  color: string;
}

// "stack" — shifts stacked top-to-bottom in each day column (All Shifts page).
// "time" — shifts positioned on a shared hour axis so they align across days
//   by time of day (account page, per papabear 2026-07-22).
type CalendarLayout = "stack" | "time";

interface IShiftsCalendarProps {
  events: ICalendarEvent[];
  onSelect: (id: number) => void;
  layout?: CalendarLayout;
}

// pixels per hour for the time-grid layout
const PX_PER_HOUR = 56;
// width of the hour-label gutter in the time-grid layout
const GUTTER_WIDTH = 52;

// Lightweight week-view calendar for the Shifts page. Renders a 5-day grid
// (Mon–Fri) of clickable shift blocks, colored by type, grayed/locked when the
// signed-in volunteer isn't eligible. Prototype — no calendar library, just
// MUI + dayjs (per papabear 2026-07-17).
export const ShiftsCalendar = ({
  events,
  onSelect,
  layout = "stack",
}: IShiftsCalendarProps) => {
  const theme = useTheme();

  // Default the visible week to the one containing the earliest shift, so it
  // opens on the event week rather than "today" (which is months earlier).
  const earliest =
    events.length > 0
      ? events.map((e) => e.date).sort()[0]
      : dayjs().format("YYYY-MM-DD");
  // Mon–Fri only — PEERS runs no weekend shifts (per papabear 2026-07-17).
  // startOf("week") is Sunday, so +1 day = the Monday of that week.
  const mondayOf = (d: string | Dayjs) =>
    dayjs(d).startOf("week").add(1, "day");
  // Fixed to the event week — no navigation (per stickybeak 2026-07-19).
  const weekStart = mondayOf(earliest);

  const days = Array.from({ length: 5 }, (_, i) => weekStart.add(i, "day"));
  const weekLabel = `${weekStart.format("MMM D")} – ${weekStart
    .add(4, "day")
    .format("MMM D, YYYY")}`;

  // Time-grid axis, shared across every day column so the same time of day sits
  // at the same vertical offset in each column.
  const { startMin, endMin } = getTimeAxis(events);
  const hourMarks = getHourMarks(startMin, endMin);
  const gridHeight = ((endMin - startMin) / 60) * PX_PER_HOUR;

  // A single clickable shift block. `fill` makes it stretch to its container,
  // used by the time-grid layout where the wrapper sets the height.
  const renderBlock = (e: ICalendarEvent, fill: boolean) => {
    const badge = shiftBadge(e.type);
    const block = (
      <Box
        onClick={() => {
          if (e.eligible && !e.canceled) onSelect(e.id);
        }}
        sx={{
          backgroundColor: lighten(e.color, 0.3),
          border: `1px solid ${e.color}`,
          borderRadius: 1,
          cursor: e.eligible && !e.canceled ? "pointer" : "not-allowed",
          height: fill ? "100%" : "auto",
          opacity: e.eligible && !e.canceled ? 1 : 0.55,
          overflow: "hidden",
          p: 0.75,
          "&:hover":
            e.eligible && !e.canceled ? { filter: "brightness(0.97)" } : {},
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={0.5}
        >
          <Stack alignItems="center" direction="row" spacing={0.5}>
            {!e.eligible && !e.canceled && (
              <LockIcon fontSize="inherit" sx={{ color: "text.disabled" }} />
            )}
            <Typography sx={{ fontWeight: 600 }} variant="caption">
              {formatTime(e.startTime, e.endTime)}
            </Typography>
          </Stack>
          {/* checked box = you're signed up for this shift */}
          {e.isMine && (
            <CheckBoxIcon
              color="success"
              fontSize="small"
              titleAccess="You are signed up for this shift"
            />
          )}
        </Stack>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={0.5}
        >
          <Typography
            sx={{
              textDecoration: e.canceled ? "line-through" : "none",
            }}
            variant="caption"
            component="div"
          >
            {e.type}
          </Typography>
          {/* SQUAD / LEAD badge on the middle-right */}
          {badge && (
            <Box
              alt={badge.alt}
              component="img"
              src={badge.src}
              sx={{
                flexShrink: 0,
                height: 16,
                width: "auto",
              }}
            />
          )}
        </Stack>
        {/* filled count is omitted (total 0) for the account
            "My Shifts" calendar, which lists only own shifts */}
        {(e.canceled || e.total > 0) && (
          <Typography
            color={e.canceled ? "error.main" : "text.secondary"}
            variant="caption"
            component="div"
          >
            {e.canceled ? "CANCELED" : `${e.filled} / ${e.total} filled`}
          </Typography>
        )}
      </Box>
    );

    // Wrap locked (ineligible) blocks in a tooltip explaining why.
    return !e.eligible && !e.canceled ? (
      <Tooltip title={e.lockedReason}>{block}</Tooltip>
    ) : (
      block
    );
  };

  const renderDayHeader = (day: Dayjs) => {
    const isToday = day.isSame(dayjs(), "day");
    return (
      <Box
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: isToday
            ? lighten(theme.palette.secondary.main, 0.85)
            : "rgba(0,0,0,0.02)",
          px: 1,
          py: 0.5,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {day.format("ddd")}
        </Typography>
        <Typography sx={{ fontWeight: 600 }} variant="body2">
          {day.format("M/D")}
        </Typography>
      </Box>
    );
  };

  const weekLabelBar = (
    <Typography
      component="h2"
      sx={{
        bgcolor: theme.palette.common.white,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mb: 2,
        py: 1,
        textAlign: "center",
      }}
      variant="h6"
    >
      {weekLabel}
    </Typography>
  );

  // Time-grid layout — hour gutter + Mon–Fri columns, shifts positioned by time.
  if (layout === "time") {
    const gridColumns = `${GUTTER_WIDTH}px repeat(5, minmax(140px, 1fr))`;

    return (
      <Box>
        {weekLabelBar}
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: GUTTER_WIDTH + 5 * 140 }}>
            {/* header row: empty gutter + day headers */}
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: gridColumns,
                mb: 1,
              }}
            >
              <Box />
              {days.map((day) => (
                <Box
                  key={day.format("YYYY-MM-DD")}
                  sx={{
                    bgcolor: theme.palette.common.white,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                  }}
                >
                  {renderDayHeader(day)}
                </Box>
              ))}
            </Box>

            {/* body row: hour gutter + day columns with positioned blocks */}
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: gridColumns,
              }}
            >
              {/* hour gutter */}
              <Box sx={{ position: "relative", height: gridHeight }}>
                {hourMarks.map((hour) => (
                  <Typography
                    key={hour}
                    color="text.secondary"
                    variant="caption"
                    sx={{
                      position: "absolute",
                      right: 4,
                      top: ((hour * 60 - startMin) / 60) * PX_PER_HOUR - 8,
                    }}
                  >
                    {formatHourLabel(hour)}
                  </Typography>
                ))}
              </Box>

              {/* day columns */}
              {days.map((day) => {
                const dayEvents = events.filter((e) =>
                  dayjs(e.date).isSame(day, "day")
                );
                const { placed, laneCount } = packDayLanes(dayEvents);

                return (
                  <Box
                    key={day.format("YYYY-MM-DD")}
                    sx={{
                      bgcolor: theme.palette.common.white,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      height: gridHeight,
                      position: "relative",
                    }}
                  >
                    {/* horizontal hour gridlines */}
                    {hourMarks.map((hour) => (
                      <Box
                        key={hour}
                        sx={{
                          borderTop: `1px solid ${theme.palette.divider}`,
                          left: 0,
                          opacity: 0.5,
                          position: "absolute",
                          right: 0,
                          top: ((hour * 60 - startMin) / 60) * PX_PER_HOUR,
                        }}
                      />
                    ))}

                    {/* positioned shift blocks */}
                    {placed.map(({ event, lane, startMin: s, endMin: en }) => {
                      const top = ((s - startMin) / 60) * PX_PER_HOUR;
                      const height = Math.max(
                        ((en - s) / 60) * PX_PER_HOUR,
                        22
                      );
                      const widthPct = 100 / laneCount;

                      return (
                        <Box
                          key={event.id}
                          sx={{
                            position: "absolute",
                            top,
                            height,
                            left: `calc(${lane * widthPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                        >
                          {renderBlock(event, true)}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Stack layout (default) — shifts stacked in each day column.
  return (
    <Box>
      {weekLabelBar}

      {/* 5-day grid; scrolls horizontally on narrow screens */}
      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "repeat(5, minmax(150px, 1fr))",
          }}
        >
          {days.map((day) => {
            const dayEvents = events
              .filter((e) => dayjs(e.date).isSame(day, "day"))
              .sort((a, b) => (a.startTime < b.startTime ? -1 : 1));

            return (
              <Box
                key={day.format("YYYY-MM-DD")}
                sx={{
                  bgcolor: theme.palette.common.white,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  minHeight: 120,
                }}
              >
                {renderDayHeader(day)}

                {/* shift blocks */}
                <Stack spacing={0.5} sx={{ p: 0.5 }}>
                  {dayEvents.length === 0 && (
                    <Typography
                      color="text.disabled"
                      sx={{ textAlign: "center", py: 1 }}
                      variant="caption"
                    >
                      &mdash;
                    </Typography>
                  )}
                  {dayEvents.map((e) => (
                    <Box key={e.id}>{renderBlock(e, false)}</Box>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
