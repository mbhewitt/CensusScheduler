"use client";

import { CalendarMonth as CalendarMonthIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { BreadcrumbsNav } from "@/components/general/BreadcrumbsNav";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Loading } from "@/components/general/Loading";
import { Hero } from "@/components/layout/Hero";
import type { IResShiftRowItem } from "@/components/types/shifts";
import type { IResVolunteerShiftItem } from "@/components/types/volunteers";
import { fetcherGet } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";

interface IScheduleProps {
  shiftboardId: number;
}

// One normalized row for the agenda, built from either the volunteer's own
// signups or the open-shift list so both render the same way.
interface IAgendaItem {
  key: string;
  timeId: number;
  date: string;
  dateName: string;
  startTime: string;
  endTime: string;
  title: string;
  department: string;
  csp: string;
  canceled: boolean;
  state: "mine" | "open" | "full";
  slots?: { filled: number; total: number };
}

const cspLabel = (min: number, max: number) =>
  min === max ? `${min}` : `${min}-${max}`;

export const Schedule = ({ shiftboardId }: IScheduleProps) => {
  const theme = useTheme();
  const [showOpen, setShowOpen] = useState(true);
  const [department, setDepartment] = useState("All");

  const {
    data: dataMine,
    error: errorMine,
  }: { data: IResVolunteerShiftItem[]; error: Error | undefined } = useSWR(
    `/api/volunteers/${shiftboardId}/shifts`,
    fetcherGet
  );
  const {
    data: dataOpen,
    error: errorOpen,
  }: { data: IResShiftRowItem[]; error: Error | undefined } = useSWR(
    "/api/shifts",
    fetcherGet
  );

  // Normalize + merge the two sources into one date/time-sorted agenda.
  const { items, departments } = useMemo(() => {
    const mine = dataMine ?? [];
    const open = dataOpen ?? [];
    const myTimeIds = new Set(mine.map((m) => m.shift.timeId));

    const agenda: IAgendaItem[] = [];

    for (const m of mine) {
      const s = m.shift;
      agenda.push({
        key: `mine-${s.timePositionId}`,
        timeId: s.timeId,
        date: s.date,
        dateName: s.dateName,
        startTime: s.startTime,
        endTime: s.endTime,
        title: s.positionName,
        department: m.department.name,
        csp: cspLabel(s.csp, s.csp),
        canceled: s.canceled,
        state: "mine",
      });
    }

    for (const o of open) {
      if (o.canceled || myTimeIds.has(o.id)) continue; // shown as "mine" already
      const isFull = o.slotsTotal - o.slotsFilled <= 0;
      agenda.push({
        key: `open-${o.id}`,
        timeId: o.id,
        date: o.date,
        dateName: o.dateName,
        startTime: o.startTime,
        endTime: o.endTime,
        title: o.type,
        department: o.department.name,
        csp: cspLabel(o.cspMin, o.cspMax),
        canceled: false,
        state: isFull ? "full" : "open",
        slots: { filled: o.slotsFilled, total: o.slotsTotal },
      });
    }

    agenda.sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date)
    );

    const departments = [
      "All",
      ...Array.from(new Set(agenda.map((i) => i.department).filter(Boolean))).sort(),
    ];

    return { items: agenda, departments };
  }, [dataMine, dataOpen]);

  // Apply the toggle + department filter, then group into consecutive days.
  const days = useMemo(() => {
    const filtered = items.filter(
      (i) =>
        (showOpen || i.state === "mine") &&
        (department === "All" || i.department === department)
    );
    const out: { date: string; dateName: string; items: IAgendaItem[] }[] = [];
    for (const item of filtered) {
      const last = out[out.length - 1];
      if (last && last.date === item.date) last.items.push(item);
      else
        out.push({ date: item.date, dateName: item.dateName, items: [item] });
    }
    return out;
  }, [items, showOpen, department]);

  const mineCount = items.filter((i) => i.state === "mine").length;

  // render
  // ------------------------------------------------------------
  const hero = (
    <Hero
      imageStyles={{
        backgroundImage: "url(/banners/camp-at-day.jpg)",
        backgroundSize: "cover",
      }}
      text="My Shifts"
    />
  );

  if (errorMine || errorOpen) {
    return (
      <>
        {hero}
        <Container maxWidth="md">
          <ErrorAlert />
        </Container>
      </>
    );
  }
  if (!dataMine || !dataOpen) {
    return (
      <>
        {hero}
        <Container maxWidth="md">
          <Loading />
        </Container>
      </>
    );
  }

  const swatch = (color: string) => (
    <Box
      component="span"
      sx={{
        width: 11,
        height: 11,
        borderRadius: "3px",
        backgroundColor: color,
        display: "inline-block",
        mr: 0.75,
        verticalAlign: -1,
      }}
    />
  );

  return (
    <>
      {hero}
      <Container maxWidth="md" component="main">
        <Box sx={{ mb: 3 }}>
          <BreadcrumbsNav>
            <Typography>My Shifts</Typography>
          </BreadcrumbsNav>
        </Box>

        <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
          Your shifts &amp; open shifts
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Everything you&apos;re signed up for, plus what&apos;s still open.
        </Typography>

        {/* controls */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mb: 1.5 }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showOpen}
                onChange={(e) => setShowOpen(e.target.checked)}
              />
            }
            label="Show open shifts"
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="department-filter">Department</InputLabel>
            <Select
              labelId="department-filter"
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Typography color="text.secondary" variant="body2">
            {swatch(theme.palette.success.main)}You&apos;re signed up
          </Typography>
          {showOpen && (
            <Typography color="text.secondary" variant="body2">
              {swatch(theme.palette.secondary.main)}Open — you can join
            </Typography>
          )}
        </Stack>

        {days.length === 0 ? (
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }}>
                {mineCount === 0
                  ? "You haven't signed up for any Census shifts yet."
                  : "No shifts match your filters."}
              </Typography>
              <Button
                component={Link}
                href="/shifts"
                startIcon={<CalendarMonthIcon />}
                variant="contained"
              >
                Browse and sign up for shifts
              </Button>
            </CardContent>
          </Card>
        ) : (
          days.map((day) => (
            <Box component="section" key={day.date} sx={{ mb: 1 }}>
              <Typography
                component="h3"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontSize: "0.8rem",
                  borderBottom: `2px solid ${theme.palette.divider}`,
                  pb: 0.75,
                  mt: 2.5,
                  mb: 1.5,
                }}
              >
                {formatDateName(day.date, day.dateName)}
              </Typography>

              <Stack spacing={1.25}>
                {day.items.map((item) => {
                  const accent =
                    item.state === "mine"
                      ? theme.palette.success.main
                      : item.state === "open"
                        ? theme.palette.secondary.main
                        : theme.palette.divider;
                  return (
                    <Card
                      key={item.key}
                      sx={{
                        borderLeft: `5px solid ${
                          item.canceled ? theme.palette.error.main : accent
                        }`,
                        ...((item.canceled || item.state === "full") && {
                          opacity: 0.72,
                        }),
                      }}
                    >
                      <CardContent
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 2,
                          "&:last-child": { pb: 2 },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            color="text.secondary"
                            variant="body2"
                            sx={{ fontWeight: 700 }}
                          >
                            {formatTime(item.startTime, item.endTime)}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              ...(item.canceled && {
                                textDecoration: "line-through",
                              }),
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 0.5, flexWrap: "wrap" }}
                          >
                            {item.department && (
                              <Chip label={item.department} size="small" />
                            )}
                            {item.csp !== "0" && (
                              <Typography
                                color="text.secondary"
                                variant="body2"
                              >
                                {item.csp} CSP
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ flexShrink: 0, textAlign: "right" }}>
                          {item.canceled ? (
                            <Typography
                              sx={{
                                color: "error.main",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            >
                              CANCELED
                            </Typography>
                          ) : item.state === "mine" ? (
                            <Chip
                              label="✓ You're signed up"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          ) : item.state === "full" ? (
                            <Typography
                              color="text.secondary"
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              Full
                            </Typography>
                          ) : (
                            <Stack alignItems="flex-end" spacing={0.75}>
                              <Typography
                                color="text.secondary"
                                variant="body2"
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    color: theme.palette.secondary.main,
                                    fontWeight: 800,
                                  }}
                                >
                                  {item.slots
                                    ? item.slots.total - item.slots.filled
                                    : 0}
                                </Box>{" "}
                                open
                              </Typography>
                              <Button
                                component={Link}
                                href={`/shifts/${item.timeId}/volunteers`}
                                size="small"
                                variant="contained"
                              >
                                Sign up
                              </Button>
                            </Stack>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          ))
        )}

        {mineCount > 0 && (
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mt: 4, textAlign: "center" }}
          >
            {mineCount} shift{mineCount === 1 ? "" : "s"} signed up
          </Typography>
        )}
      </Container>
    </>
  );
};
