"use client";

import {
  CalendarMonth as CalendarMonthIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import Link from "next/link";
import { useMemo } from "react";
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

    agenda.sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date)
    );

    return { items: agenda };
  }, [dataMine, dataOpen, dataElig]);

  // Present/Future by default — hide past shifts so nobody scrolls past
  // yesterday to reach today. (The full Timeline/Type/Date/Fill filter set +
  // "Include my assigned shifts" toggle is the next phase, per #470.) Group
  // into consecutive days.
  const days = useMemo(() => {
    const filtered = items.filter(
      (i) => !dayjs(i.date).isBefore(dayjs(), "day")
    );
    const out: { date: string; dateName: string; items: IAgendaItem[] }[] = [];
    for (const item of filtered) {
      const last = out[out.length - 1];
      if (last && last.date === item.date) last.items.push(item);
      else
        out.push({ date: item.date, dateName: item.dateName, items: [item] });
    }
    return out;
  }, [items]);

  const mineCount = items.filter((i) => i.state === "mine").length;

  // render
  // ------------------------------------------------------------
  const hero = (
    <Hero
      imageStyles={{
        backgroundImage: "url(/banners/camp-at-day.jpg)",
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

  return (
    <>
      {hero}
      <Container maxWidth="md" component="main">
        <Box sx={{ mb: 3 }}>
          <BreadcrumbsNav>
            <Typography>Shifts</Typography>
          </BreadcrumbsNav>
        </Box>

        <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
          {isSignedIn ? "Your shifts & open shifts" : "Census shifts"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {isSignedIn
            ? "Everything you're signed up for, plus what's still open."
            : "Browse open Census shifts and sign up."}
        </Typography>

        {/* legend — the full filter set (Timeline / Type / Date / Fill +
            "Include my assigned shifts" toggle) is the next phase, per #470 */}
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
                  // <=10% filled = genuinely needs help (matches the reports
                  // sheet's UNDER=0.10 threshold, per #470).
                  const underfilled =
                    !!item.slots &&
                    item.slots.total > 0 &&
                    item.slots.filled / item.slots.total <= 0.1;
                  return (
                    <Card
                      key={item.key}
                      sx={{
                        position: "relative",
                        borderLeft: `5px solid ${
                          item.canceled ? theme.palette.error.main : accent
                        }`,
                        ...((item.canceled ||
                          item.state === "full" ||
                          item.state === "conflict" ||
                          item.state === "ineligible") && {
                          backgroundColor: theme.palette.action.hover,
                        }),
                      }}
                    >
                      {/* actions menu — visible per the approved mockup; the
                          Remove / check-in wiring is the actions phase (#470) */}
                      <IconButton
                        aria-label="Shift actions"
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          color: "text.secondary",
                        }}
                      >
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            pr: 4,
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
                            <Typography variant="body2">
                              CSP: {item.csp}
                            </Typography>
                          )}
                        </Stack>

                        {item.state === "conflict" && item.conflictWith && (
                          <Box
                            sx={{
                              mt: 1,
                              backgroundColor: "#fff4e5",
                              color: "#7a4f00",
                              borderRadius: 1,
                              px: 1.25,
                              py: 0.75,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            ⚠️ Overlaps your {item.conflictWith} shift
                          </Box>
                        )}
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

                        <Box sx={{ mt: 1.5 }}>
                          {item.canceled ? (
                            <Chip
                              label="Canceled"
                              color="error"
                              size="small"
                              variant="outlined"
                            />
                          ) : item.state === "mine" ? (
                            <Chip
                              label="✓ You're signed up"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          ) : item.state === "open" ? (
                            <Button
                              component={Link}
                              href={`/shifts/${item.timeId}/volunteers`}
                              variant="contained"
                              fullWidth
                            >
                              Sign up
                            </Button>
                          ) : (
                            <Button variant="contained" fullWidth disabled>
                              Sign up unavailable
                            </Button>
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
