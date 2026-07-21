"use client";

import {
  CheckBox as CheckBoxIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { lighten, useTheme } from "@mui/material/styles";
import dayjs, { Dayjs } from "dayjs";

import { formatTime } from "@/utils/formatDateTime";

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

interface IShiftsCalendarProps {
  events: ICalendarEvent[];
  onSelect: (id: number) => void;
}

// Lightweight week-view calendar for the Shifts page. Renders a 7-day grid
// (Sun–Sat) of clickable shift blocks, colored by type, grayed/locked when the
// signed-in volunteer isn't eligible. Prototype — no calendar library, just
// MUI + dayjs (per papabear 2026-07-17).
export const ShiftsCalendar = ({ events, onSelect }: IShiftsCalendarProps) => {
  const theme = useTheme();

  // Default the visible week to the one containing the earliest shift, so it
  // opens on the event week rather than "today" (which is months earlier).
  const earliest =
    events.length > 0
      ? events.map((e) => e.date).sort()[0]
      : dayjs().format("YYYY-MM-DD");
  // Mon–Fri only — PEERS runs no weekend shifts (per papabear 2026-07-17).
  // startOf("week") is Sunday, so +1 day = the Monday of that week.
  const mondayOf = (d: string | Dayjs) => dayjs(d).startOf("week").add(1, "day");
  // Fixed to the event week — no navigation (per stickybeak 2026-07-19).
  const weekStart = mondayOf(earliest);

  const days = Array.from({ length: 5 }, (_, i) => weekStart.add(i, "day"));
  const weekLabel = `${weekStart.format("MMM D")} – ${weekStart
    .add(4, "day")
    .format("MMM D, YYYY")}`;

  return (
    <Box>
      {/* week label — fixed to the event week, no navigation */}
      <Typography
        component="h2"
        sx={{ mb: 2, textAlign: "center" }}
        variant="h6"
      >
        {weekLabel}
      </Typography>

      {/* 7-day grid; scrolls horizontally on narrow screens */}
      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "repeat(5, minmax(150px, 1fr))",
          }}
        >
          {days.map((day) => {
            const isToday = day.isSame(dayjs(), "day");
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
                {/* day header */}
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
                  {dayEvents.map((e) => {
                    const block = (
                      <Box
                        onClick={() => {
                          if (e.eligible && !e.canceled) onSelect(e.id);
                        }}
                        sx={{
                          backgroundColor: lighten(e.color, 0.3),
                          border: `1px solid ${e.color}`,
                          borderRadius: 1,
                          cursor:
                            e.eligible && !e.canceled
                              ? "pointer"
                              : "not-allowed",
                          opacity: e.eligible && !e.canceled ? 1 : 0.55,
                          p: 0.75,
                          "&:hover":
                            e.eligible && !e.canceled
                              ? { filter: "brightness(0.97)" }
                              : {},
                        }}
                      >
                        <Stack
                          alignItems="center"
                          direction="row"
                          justifyContent="space-between"
                          spacing={0.5}
                        >
                          <Stack
                            alignItems="center"
                            direction="row"
                            spacing={0.5}
                          >
                            {!e.eligible && !e.canceled && (
                              <LockIcon
                                fontSize="inherit"
                                sx={{ color: "text.disabled" }}
                              />
                            )}
                            <Typography
                              sx={{ fontWeight: 600 }}
                              variant="caption"
                            >
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
                        <Typography
                          sx={{
                            textDecoration: e.canceled
                              ? "line-through"
                              : "none",
                          }}
                          variant="caption"
                          component="div"
                        >
                          {e.type}
                        </Typography>
                        {/* filled count is omitted (total 0) for the account
                            "My Shifts" calendar, which lists only own shifts */}
                        {(e.canceled || e.total > 0) && (
                          <Typography
                            color={
                              e.canceled ? "error.main" : "text.secondary"
                            }
                            variant="caption"
                            component="div"
                          >
                            {e.canceled
                              ? "CANCELED"
                              : `${e.filled} / ${e.total} filled`}
                          </Typography>
                        )}
                      </Box>
                    );

                    // Wrap locked (ineligible) blocks in a tooltip explaining why.
                    return !e.eligible && !e.canceled ? (
                      <Tooltip key={e.id} title={e.lockedReason}>
                        {block}
                      </Tooltip>
                    ) : (
                      <Box key={e.id}>{block}</Box>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
