"use client";

import {
  CalendarMonth as CalendarMonthIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Container,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";

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
  timePositionId?: number;
  date: string;
  dateName: string;
  startTime: string;
  endTime: string;
  title: string;
  type: string;
  department: string;
  csp: string;
  canceled: boolean;
  state: "mine" | "open" | "full" | "conflict" | "ineligible";
  slots?: { filled: number; total: number };
  conflictWith?: string;
  ineligibleReason?: string;
}

const cspLabel = (min: number, max: number) =>
  min === max ? `${min}` : `${min}-${max}`;

// Friendlier labels for the internal gating-role names in the "Requires: …"
// reason. Falls back to the raw role name (Chipper-approved auto-fallback).
const FRIENDLY_ROLE: Record<string, string> = {
  CensusLabCamp: "Census Lab camper",
  CounterCultureCamp: "Counter Culture camper",
  CensusTicket: "Census ticket holder",
};
const friendlyRole = (role: string) => FRIENDLY_ROLE[role] ?? role;

// Strict time overlap (touching endpoints — back-to-back shifts — are fine).
const overlaps = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) => dayjs(aStart).isBefore(dayjs(bEnd)) && dayjs(bStart).isBefore(dayjs(aEnd));

export const Schedule = ({ shiftboardId }: IScheduleProps) => {
  const theme = useTheme();

  // Logged-out browse mode (on-playa walk-ups, shiftboardId <= 0): show the
  // open-shift list only — no personal "your shifts", conflicts, or
  // eligibility. Authenticated (id > 0) gets the full personalized agenda.
  const isSignedIn = shiftboardId > 0;

  const {
    data: dataMine,
    error: errorMine,
  }: { data: IResVolunteerShiftItem[]; error: Error | undefined } = useSWR(
    isSignedIn ? `/api/volunteers/${shiftboardId}/shifts` : null,
    fetcherGet
  );
  const {
    data: dataOpen,
    error: errorOpen,
  }: { data: IResShiftRowItem[]; error: Error | undefined } = useSWR(
    "/api/shifts",
    fetcherGet
  );
  // timeId -> required role name(s) for shifts this volunteer can't take.
  // Non-blocking: if it hasn't loaded (or errors) we just don't gray anything.
  const { data: dataElig }: { data: Record<number, string[]> } = useSWR(
    isSignedIn ? `/api/volunteers/${shiftboardId}/shift-eligibility` : null,
    fetcherGet
  );

  // Normalize + merge the two sources into one date/time-sorted agenda.
  const { items } = useMemo(() => {
    const mine = dataMine ?? [];
    const open = dataOpen ?? [];
    const myTimeIds = new Set(mine.map((m) => m.shift.timeId));

    const agenda: IAgendaItem[] = [];

    for (const m of mine) {
      const s = m.shift;
      agenda.push({
        key: `mine-${s.timePositionId}`,
        timeId: s.timeId,
        timePositionId: s.timePositionId,
        date: s.date,
        dateName: s.dateName,
        startTime: s.startTime,
        endTime: s.endTime,
        title: s.positionName,
        // mine payload has no shift type — department is the best available
        type: m.department.name,
        department: m.department.name,
        csp: cspLabel(s.csp, s.csp),
        canceled: s.canceled,
        state: "mine",
      });
    }

    for (const o of open) {
      if (o.canceled || myTimeIds.has(o.id)) continue; // shown as "mine" already
      const isFull = o.slotsTotal - o.slotsFilled <= 0;
      // Flag an open shift that overlaps one you're already on (our edge over
      // Shiftboard — it doesn't stop cross-department double-booking).
      const clash = mine.find(
        (m) =>
          !m.shift.canceled &&
          overlaps(
            o.startTime,
            o.endTime,
            m.shift.startTime,
            m.shift.endTime
          )
      );
      // role-gated: every position needs a role this volunteer lacks
      const requiredRoles = dataElig?.[o.id];
      const isIneligible =
        Array.isArray(requiredRoles) && requiredRoles.length > 0;
      agenda.push({
        key: `open-${o.id}`,
        timeId: o.id,
        date: o.date,
        dateName: o.dateName,
        startTime: o.startTime,
        endTime: o.endTime,
        title: o.type,
        type: o.type,
        department: o.department.name,
        csp: cspLabel(o.cspMin, o.cspMax),
        canceled: false,
        // Full first: a full shift can't be taken by anyone, so "Full" is the
        // truer label than "not eligible" (which reads as singling the viewer
        // out). Then role-ineligible, then a time conflict, else open.
        state: isFull
          ? "full"
          : isIneligible
            ? "ineligible"
            : clash
              ? "conflict"
              : "open",
        slots: { filled: o.slotsFilled, total: o.slotsTotal },
        conflictWith: clash ? clash.shift.positionName : undefined,
        // Shown even when full (Chipper 2026-07-07): both facts are useful —
        // if it's full AND they lack the role, they know not to check back
        // hoping a slot opens (it wouldn't help), and they learn which role
        // to pursue to become eligible later. Label is "Full", note adds the
        // role. Both true, both shown.
        ineligibleReason: isIneligible
          ? `Requires the ${requiredRoles.map(friendlyRole).join(" or ")} role`
          : undefined,
      });
    }

    // Null-safe: some shifts have a missing date/startTime; a bare
    // .localeCompare on null throws and white-screens the page (2026-07-08).
    agenda.sort((a, b) =>
      (a.date ?? "") === (b.date ?? "")
        ? (a.startTime ?? "").localeCompare(b.startTime ?? "")
        : (a.date ?? "").localeCompare(b.date ?? "")
    );

    return { items: agenda };
  }, [dataMine, dataOpen, dataElig]);

  // Filter set (#470). Funnel toggles the panel; chips show/remove active values.
  // Every filter follows the same "empty = show all" convention; empty selection
  // is no filter (the label renders "All").
  const [showFilters, setShowFilters] = useState(false);
  const [timeline, setTimeline] = useState<string[]>(["future"]); // "future" | "past"
  const [types, setTypes] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]); // "open" | "full"
  const [myShiftsOnly, setMyShiftsOnly] = useState(false);

  // Reset every filter to its default (#470 design review, item 8).
  const removeAllFilters = () => {
    setTimeline(["future"]);
    setTypes([]);
    setDates([]);
    setAvailability([]);
    setMyShiftsOnly(false);
  };

  // Keep a multiselect's Select value as a string[] (MUI hands back a comma
  // string on native change). Shared by every dropdown below.
  const asArray = (v: string | string[]) =>
    typeof v === "string" ? v.split(",").filter(Boolean) : v;

  // "Select all" toggle for a multiselect: if every option is already picked,
  // clear it; otherwise select them all.
  const toggleSelectAll = (
    current: string[],
    all: string[],
    set: (next: string[]) => void
  ) => set(current.length === all.length ? [] : all);

  // Distinct Type / Date option lists, drawn from the agenda itself.
  const typeOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.type))).sort(),
    [items]
  );
  // Keep dates in date order (items is already date-sorted).
  const dateOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { date: string; dateName: string }[] = [];
    for (const i of items) {
      if (!seen.has(i.dateName)) {
        seen.add(i.dateName);
        out.push({ date: i.date, dateName: i.dateName });
      }
    }
    return out;
  }, [items]);

  // Present/Future by default — hide past shifts so nobody scrolls past
  // yesterday to reach today. Timeline always applies to both sections.
  // Empty selection = show all (both future and past), like every other filter.
  const inTimeline = (i: IAgendaItem) => {
    if (timeline.length === 0) return true;
    const isPast = dayjs(i.date).isBefore(dayjs(), "day");
    return timeline.includes(isPast ? "past" : "future");
  };

  // Group a flat (already date-sorted) list into consecutive-day sections.
  const groupByDay = (list: IAgendaItem[]) => {
    const out: { date: string; dateName: string; items: IAgendaItem[] }[] = [];
    for (const item of list) {
      const last = out[out.length - 1];
      if (last && last.date === item.date) last.items.push(item);
      else
        out.push({ date: item.date, dateName: item.dateName, items: [item] });
    }
    return out;
  };

  // Main list: ALL shifts — open AND your own — mixed by date, narrowed by
  // Timeline/Type/Date/Availability. Your own shifts show here (with the
  // "You're signed up" marker) so you see everything in context and can tell
  // which are yours — that's the whole point (Chipper 2026-07-09). When the
  // "My Shifts" toggle is ON the main list is restricted to your own shifts
  // (still narrowed by the other filters), and the bottom section is dropped.
  const mainDays = useMemo(
    () =>
      groupByDay(
        items.filter((i) => {
          if (myShiftsOnly && i.state !== "mine") return false;
          if (!inTimeline(i)) return false;
          if (types.length > 0 && !types.includes(i.type)) return false;
          if (dates.length > 0 && !dates.includes(i.dateName)) return false;
          if (availability.length > 0 && !availability.includes(i.state))
            return false;
          return true;
        })
      ),
    [items, timeline, types, dates, availability, myShiftsOnly]
  );

  // Bottom "My Shifts" section: the volunteer's full schedule for this time
  // scope (Timeline only, never narrowed). Shown ONLY when a narrowing filter
  // is active, so filtering can't hide your commitments — but no redundant
  // double-listing when the main already shows everything, and suppressed
  // entirely when the My Shifts toggle already restricts the main to yours.
  const anyNarrowing =
    types.length > 0 || dates.length > 0 || availability.length > 0;
  const mineDays = useMemo(
    () => groupByDay(items.filter((i) => i.state === "mine" && inTimeline(i))),
    [items, timeline]
  );

  const mineCount = items.filter((i) => i.state === "mine").length;

  // render
  // ------------------------------------------------------------
  const hero = (
    <Hero
      imageStyles={{
        backgroundImage: "url(/banners/databeast-volunteers-exiting.jpg)",
        backgroundSize: "cover",
      }}
      text="Shifts"
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
  if (!dataOpen || (isSignedIn && !dataMine)) {
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

  // One day-grouped section of browse-only cards. Whole card links to the
  // shift detail page; no sign-up / remove actions here (#470).
  const renderDay = (day: {
    date: string;
    dateName: string;
    items: IAgendaItem[];
  }) => (
    <Box component="section" key={day.date} sx={{ mb: 1 }}>
      <Typography
        component="h4"
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
          // <=10% filled = genuinely needs help (matches the reports
          // sheet's UNDER=0.10 threshold, per #470).
          const underfilled =
            !!item.slots &&
            item.slots.total > 0 &&
            item.slots.filled / item.slots.total <= 0.1;
          return (
            <Card
              key={item.key}
              component={Link}
              href={`/shifts/${item.timeId}/volunteers`}
              sx={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                borderLeft: `5px solid ${
                  item.canceled ? theme.palette.error.main : accent
                }`,
                ...((item.canceled ||
                  item.state === "full" ||
                  item.state === "ineligible") && {
                  backgroundColor: theme.palette.action.hover,
                }),
              }}
            >
              <CardContent sx={{ "&:last-child": { pb: 2 } }}>
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
                {item.department && (
                  <Typography color="text.secondary" variant="body2">
                    {item.department}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 0.75, color: "text.secondary" }}
                >
                  <Typography variant="body2">
                    🕐 {formatTime(item.startTime, item.endTime)}
                  </Typography>
                  {item.slots && (
                    <Typography variant="body2">
                      👥{" "}
                      <Box
                        component="span"
                        sx={{
                          color: underfilled
                            ? theme.palette.error.main
                            : "inherit",
                          fontWeight: underfilled ? 800 : 700,
                        }}
                      >
                        {item.slots.filled}
                      </Box>{" "}
                      / {item.slots.total} filled
                      {underfilled ? " · needs help" : ""}
                    </Typography>
                  )}
                  {item.csp !== "0" && (
                    <Typography variant="body2">CSP: {item.csp}</Typography>
                  )}
                </Stack>

                {item.ineligibleReason && (
                  <Box
                    sx={{
                      mt: 1,
                      backgroundColor: "#fdecec",
                      color: "#8a1c1c",
                      borderRadius: 1,
                      px: 1.25,
                      py: 0.75,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    🔒 {item.ineligibleReason}
                  </Box>
                )}

                {(item.canceled || item.state === "mine") && (
                  <Box sx={{ mt: 1.5 }}>
                    {item.canceled ? (
                      <Chip
                        label="Canceled"
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="✓ You're signed up"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );

  // Keep dropdowns bounded on mobile (not fullscreen) and don't lock scroll.
  const menuProps = {
    disableScrollLock: true,
    PaperProps: { sx: { maxHeight: 320 } },
  };

  return (
    <>
      {hero}
      <Container maxWidth="md" component="main">
        {/* funnel toggle (single title lives in the Hero, #470 item 5) */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1, mb: 1 }}>
          <IconButton
            aria-label="Filter"
            onClick={() => setShowFilters((v) => !v)}
            color={showFilters ? "primary" : "default"}
          >
            <FilterListIcon />
          </IconButton>
        </Stack>

        {/* filter panel (#470) — bounded, full-width so it fits mobile with a
            header row (Filters + remove-all + close) matching /shifts */}
        <Collapse in={showFilters}>
          <Box
            sx={{
              mb: 2,
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography sx={{ fontWeight: 800 }}>Filters</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Button size="small" onClick={removeAllFilters}>
                  Remove all filters
                </Button>
                <IconButton
                  aria-label="Close filters"
                  size="small"
                  onClick={() => setShowFilters(false)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel id="timeline-label" shrink>
                  Timeline
                </InputLabel>
                <Select
                  labelId="timeline-label"
                  label="Timeline"
                  multiple
                  displayEmpty
                  value={timeline}
                  MenuProps={menuProps}
                  onChange={(e) => setTimeline(asArray(e.target.value))}
                  renderValue={(selected) =>
                    selected.length === 0
                      ? "All"
                      : selected
                          .map((v) => (v === "past" ? "Past" : "Present / Future"))
                          .join(", ")
                  }
                >
                  <MenuItem
                    onClick={() =>
                      toggleSelectAll(timeline, ["future", "past"], setTimeline)
                    }
                  >
                    Select all
                  </MenuItem>
                  <MenuItem value="future">Present / Future</MenuItem>
                  <MenuItem value="past">Past</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel id="type-label" shrink>
                  Type
                </InputLabel>
                <Select
                  labelId="type-label"
                  label="Type"
                  multiple
                  displayEmpty
                  value={types}
                  MenuProps={menuProps}
                  onChange={(e) => setTypes(asArray(e.target.value))}
                  renderValue={(selected) =>
                    selected.length === 0 ? "All" : selected.join(", ")
                  }
                >
                  <MenuItem
                    onClick={() =>
                      toggleSelectAll(types, typeOptions, setTypes)
                    }
                  >
                    Select all
                  </MenuItem>
                  {typeOptions.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel id="date-label" shrink>
                  Date
                </InputLabel>
                <Select
                  labelId="date-label"
                  label="Date"
                  multiple
                  displayEmpty
                  value={dates}
                  MenuProps={menuProps}
                  onChange={(e) => setDates(asArray(e.target.value))}
                  renderValue={(selected) =>
                    selected.length === 0 ? "All" : selected.join(", ")
                  }
                >
                  <MenuItem
                    onClick={() =>
                      toggleSelectAll(
                        dates,
                        dateOptions.map((d) => d.dateName),
                        setDates
                      )
                    }
                  >
                    Select all
                  </MenuItem>
                  {dateOptions.map((d) => (
                    <MenuItem key={d.dateName} value={d.dateName}>
                      {d.dateName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel id="availability-label" shrink>
                  Availability
                </InputLabel>
                <Select
                  labelId="availability-label"
                  label="Availability"
                  multiple
                  displayEmpty
                  value={availability}
                  MenuProps={menuProps}
                  onChange={(e) => setAvailability(asArray(e.target.value))}
                  renderValue={(selected) =>
                    selected.length === 0
                      ? "All"
                      : selected
                          .map((v) => (v === "open" ? "Open" : "Full"))
                          .join(", ")
                  }
                >
                  <MenuItem
                    onClick={() =>
                      toggleSelectAll(
                        availability,
                        ["open", "full"],
                        setAvailability
                      )
                    }
                  >
                    Select all
                  </MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="full">Full</MenuItem>
                </Select>
              </FormControl>

              {isSignedIn && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={myShiftsOnly}
                      onChange={(e) => setMyShiftsOnly(e.target.checked)}
                    />
                  }
                  label="My Shifts"
                />
              )}
            </Stack>
          </Box>
        </Collapse>

        {/* active-filter chips (each ✕ removes just that value) */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mb: 2 }}
        >
          {timeline.map((t) => (
            <Chip
              key={`chip-timeline-${t}`}
              label={t === "past" ? "Past" : "Present / Future"}
              size="small"
              onDelete={() => setTimeline(timeline.filter((x) => x !== t))}
            />
          ))}
          {types.map((t) => (
            <Chip
              key={`chip-type-${t}`}
              label={t}
              size="small"
              onDelete={() => setTypes(types.filter((x) => x !== t))}
            />
          ))}
          {dates.map((d) => (
            <Chip
              key={`chip-date-${d}`}
              label={d}
              size="small"
              onDelete={() => setDates(dates.filter((x) => x !== d))}
            />
          ))}
          {availability.map((a) => (
            <Chip
              key={`chip-availability-${a}`}
              label={a === "open" ? "Open" : "Full"}
              size="small"
              onDelete={() =>
                setAvailability(availability.filter((x) => x !== a))
              }
            />
          ))}
        </Stack>

        {/* legend */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 3 }}
          flexWrap="wrap"
          useFlexGap
        >
          {isSignedIn && (
            <Typography color="text.secondary" variant="body2">
              {swatch(theme.palette.success.main)}You&apos;re signed up
            </Typography>
          )}
          <Typography color="text.secondary" variant="body2">
            {swatch(theme.palette.secondary.main)}You can sign up
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {swatch(theme.palette.divider)}Unavailable
          </Typography>
        </Stack>

        {/* Main list: ALL shifts (open + your assigned), mixed by date */}
        {mainDays.length === 0 ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography>No shifts match your filters.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ mb: 4 }}>{mainDays.map(renderDay)}</Box>
        )}

        {/* My Shifts — your complete schedule, shown when a filter is active so
            filtering can't hide your commitments. Suppressed when the My Shifts
            toggle already restricts the main list to yours (redundant). */}
        {isSignedIn && !myShiftsOnly && mineCount > 0 && anyNarrowing && (
          <>
            <Typography
              component="h3"
              variant="h6"
              sx={{ fontWeight: 800, mb: 1 }}
            >
              My Shifts
            </Typography>
            {mineDays.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography sx={{ mb: 2 }}>
                    You have no shifts in this time range.
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
              mineDays.map(renderDay)
            )}
          </>
        )}
      </Container>
    </>
  );
};
