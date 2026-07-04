"use client";

import { CalendarMonth as CalendarMonthIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import useSWR from "swr";

import { BreadcrumbsNav } from "@/components/general/BreadcrumbsNav";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Loading } from "@/components/general/Loading";
import { Hero } from "@/components/layout/Hero";
import type { IResVolunteerShiftItem } from "@/components/types/volunteers";
import { fetcherGet } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";

interface IScheduleProps {
  shiftboardId: number;
}

// Group the (already date-ordered) shift list into consecutive day buckets so
// the agenda can render a header per day.
const groupByDay = (list: IResVolunteerShiftItem[]) => {
  const days: {
    date: string;
    dateName: string;
    items: IResVolunteerShiftItem[];
  }[] = [];
  for (const item of list) {
    const last = days[days.length - 1];
    if (last && last.date === item.shift.date) {
      last.items.push(item);
    } else {
      days.push({
        date: item.shift.date,
        dateName: item.shift.dateName,
        items: [item],
      });
    }
  }
  return days;
};

export const Schedule = ({ shiftboardId }: IScheduleProps) => {
  const theme = useTheme();
  const {
    data,
    error,
  }: { data: IResVolunteerShiftItem[]; error: Error | undefined } = useSWR(
    `/api/volunteers/${shiftboardId}/shifts`,
    fetcherGet
  );

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

  if (error) {
    return (
      <>
        {hero}
        <Container maxWidth="md">
          <ErrorAlert />
        </Container>
      </>
    );
  }
  if (!data) {
    return (
      <>
        {hero}
        <Container maxWidth="md">
          <Loading />
        </Container>
      </>
    );
  }

  const active = data.filter((item) => !item.shift.canceled);
  const days = groupByDay(data);

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
          Your Census shifts
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Everything you&apos;re signed up for, so far.
        </Typography>

        {days.length === 0 ? (
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }}>
                You haven&apos;t signed up for any Census shifts yet.
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
                  const { shift, department } = item;
                  return (
                    <Card
                      key={shift.timePositionId}
                      sx={{
                        borderLeft: `5px solid ${
                          shift.canceled
                            ? theme.palette.error.main
                            : theme.palette.success.main
                        }`,
                        ...(shift.canceled && { opacity: 0.7 }),
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
                            {formatTime(shift.startTime, shift.endTime)}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              ...(shift.canceled && {
                                textDecoration: "line-through",
                              }),
                            }}
                          >
                            {shift.positionName}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 0.5, flexWrap: "wrap" }}
                          >
                            {department.name && (
                              <Chip label={department.name} size="small" />
                            )}
                            {shift.csp > 0 && (
                              <Typography
                                color="text.secondary"
                                variant="body2"
                              >
                                {shift.csp} CSP
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ flexShrink: 0, textAlign: "right" }}>
                          {shift.canceled ? (
                            <Typography
                              sx={{
                                color: "error.main",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            >
                              CANCELED
                            </Typography>
                          ) : (
                            <Chip
                              label="✓ You're signed up"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
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

        {days.length > 0 && (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <Button
              component={Link}
              href="/shifts"
              startIcon={<CalendarMonthIcon />}
              variant="outlined"
            >
              Browse and sign up for more shifts
            </Button>
            {active.length > 0 && (
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                {active.length} shift{active.length === 1 ? "" : "s"} signed up
              </Typography>
            )}
          </Stack>
        )}
      </Container>
    </>
  );
};
