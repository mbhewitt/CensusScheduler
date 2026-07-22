import {
  CalendarMonth as CalendarMonthIcon,
  Chat as ChatIcon,
  EventAvailable as EventAvailableIcon,
  Print as PrintIcon,
  ViewList as ViewListIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  lighten,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useSWR, { KeyedMutator } from "swr";

import {
  ShiftsCalendar,
  type ICalendarEvent,
} from "@/app/shifts/ShiftsCalendar";
import { VolunteerShiftsDialogRemove } from "@/app/volunteers/[shiftboardId]/account/VolunteerShiftsDialogRemove";
import { VolunteerShiftsDialogReview } from "@/app/volunteers/[shiftboardId]/account/VolunteerShiftsDialogReview";
import { DataTable } from "@/components/general/DataTable";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IResVolunteerShiftItem } from "@/components/types/volunteers";
import {
  REMOVE_SHIFT_VOLUNTEER_RES,
  SHIFT_DURING,
  SHIFT_FUTURE,
  SHIFT_PAST,
  TOGGLE_CHECK_IN_RES,
  UPDATE_REVIEW_RES,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin } from "@/utils/checkIsRoleExist";
import { fetcherGet } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";
import { getCheckInType } from "@/utils/getCheckInType";
import { buildSchedulePrintHtml } from "@/utils/buildSchedulePrintHtml";
import { getColorMap, TYPE_COLOR_OVERRIDES } from "@/utils/getColorMap";
import { shiftBadge } from "@/utils/shiftBadge";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "@/utils/setCellPropsCenter";

enum DialogList {
  Remove,
  Review,
}
interface IVolunteerShiftsProps {
  shiftboardId: number;
}
interface IState {
  dialogItem: number;
  shift: {
    date: string;
    dateName: string;
    endTime: string;
    positionName: string;
    startTime: string;
    timeId: number;
    timePositionId: number;
  };
  volunteer: {
    noShow: string;
    notes: string;
    rating: null | number;
  };
}

const socket = io();
export const VolunteerShifts = ({ shiftboardId }: IVolunteerShiftsProps) => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: {
      accountType,
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { playaName, roleList, worldName },
    },
  } = useContext(SessionContext);

  // state
  // ------------------------------------------------------------
  const [dialogCurrent, setDialogCurrent] = useState<IState>({
    dialogItem: 0,
    shift: {
      date: "",
      dateName: "",
      endTime: "",
      positionName: "",
      startTime: "",
      timeId: 0,
      timePositionId: 0,
    },
    volunteer: {
      noShow: "",
      notes: "",
      rating: null,
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "table">("table");

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const router = useRouter();
  const {
    data,
    error,
    mutate,
  }: {
    data: IResVolunteerShiftItem[];
    error: Error | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutate: KeyedMutator<any>;
  } = useSWR(`/api/volunteers/${shiftboardId}/shifts`, fetcherGet);

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    // listen for socket events
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on(
          TOGGLE_CHECK_IN_RES,
          ({
            checked,
            timePositionId,
          }: {
            checked: boolean;
            timePositionId: number;
          }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const volunteerShiftItemFound = dataMutate.find(
                (volunteerShiftItem: IResVolunteerShiftItem) =>
                  volunteerShiftItem.shift.timePositionId === timePositionId
              );
              if (volunteerShiftItemFound) {
                volunteerShiftItemFound.volunteer.noShow = checked ? "" : "Yes";
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on(
          UPDATE_REVIEW_RES,
          ({
            notes,
            rating,
            timePositionId,
          }: {
            notes: string;
            rating: number;
            timePositionId: number;
          }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const volunteerShiftItemFound = dataMutate.find(
                (volunteerShiftItem: IResVolunteerShiftItem) =>
                  volunteerShiftItem.shift.timePositionId === timePositionId
              );
              if (volunteerShiftItemFound) {
                volunteerShiftItemFound.volunteer.notes = notes;
                volunteerShiftItemFound.volunteer.rating = rating;
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on(REMOVE_SHIFT_VOLUNTEER_RES, ({ timePositionId }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            const volunteerShiftListNew = dataMutate.filter(
              (volunteerShiftItem: IResVolunteerShiftItem) =>
                volunteerShiftItem.shift.timePositionId !== timePositionId
            );

            mutate(volunteerShiftListNew);
          }
        });
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{error.message}</strong>
            </SnackbarText>,
            {
              persist: true,
              variant: "error",
            }
          );
        }

        throw error;
      }
    })();
  }, [data, enqueueSnackbar, mutate]);

  // logic
  // ------------------------------------------------------------
  if (error)
    return (
      <>
        <Typography component="h2" sx={{ mb: 1 }} variant="h4">
          My Shifts
        </Typography>
        <ErrorAlert />
      </>
    );
  if (!data)
    return (
      <>
        <Typography component="h2" sx={{ mb: 1 }} variant="h4">
          My Shifts
        </Typography>
        <Loading />
      </>
    );

  const isAdmin = checkIsAdmin(accountType, roleList);
  // prepare datatable
  const columnList = [
    {
      name: "Date",
      options: { sortThirdClickReset: true },
    },
    {
      name: "Time",
      options: { filter: false, sortThirdClickReset: true },
    },

    {
      name: "Position - hidden", // hide for filter dialog
      label: "Position",
      options: {
        display: false,
      },
    },
    { name: "Position", options: { filter: false, sortThirdClickReset: true } },
    {
      name: "Actions",
      options: {
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
  ];
  if (isAdmin) {
    columnList.splice(4, 0, {
      name: "Admin review",
      options: {
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    });
  }

  const colorMapDisplay = getColorMap(data);
  const dataTable = data.map(
    ({
      department: { name: departmentName },
      shift: {
        canceled,
        date,
        dateName,
        endTime,
        positionName,
        startTime,
        timeId,
        timePositionId,
        type,
      },
      volunteer: { notes, rating },
    }: IResVolunteerShiftItem) => {
      // evaluate the check-in type and available features
      const checkInType = getCheckInType({
        dateTime: dayjs(dateTimeValue),
        endTime: dayjs(endTime),
        startTime: dayjs(startTime),
      });
      let isVolunteerRemoveAvailable = false;

      switch (checkInType) {
        case SHIFT_FUTURE:
          isVolunteerRemoveAvailable = true;
          break;
        case SHIFT_DURING: {
          isVolunteerRemoveAvailable = true;
          break;
        }
        case SHIFT_PAST: {
          isVolunteerRemoveAvailable = isAdmin;
          break;
        }
        default: {
          throw new Error(`Unknown check-in type: ${checkInType}`);
        }
      }
      // Replaced the "…" menu with two explicit links — some users didn't
      // realize the ellipsis opened a menu (per stickybeak 2026-07-19).
      const actionsLinks = (
        <Stack
          direction="row"
          justifyContent="center"
          key={`${timePositionId}-actions`}
          spacing={1}
        >
          <Button
            component={Link}
            href={`/shifts/${timeId}/volunteers`}
            size="small"
            variant="text"
          >
            View Shift
          </Button>
          <Button
            color="error"
            disabled={!isVolunteerRemoveAvailable}
            onClick={() => {
              setDialogCurrent({
                dialogItem: DialogList.Remove,
                shift: {
                  date,
                  dateName,
                  endTime,
                  positionName,
                  startTime,
                  timeId,
                  timePositionId,
                },
                volunteer: {
                  noShow: "",
                  notes: "",
                  rating: null,
                },
              });
              setIsDialogOpen(true);
            }}
            size="small"
            variant="text"
          >
            Drop Shift
          </Button>
        </Stack>
      );

      const positionCell = canceled ? (
        <Box
          key={`${timePositionId}-position`}
          sx={{ alignItems: "center", display: "flex", gap: 1 }}
        >
          <Chip
            label={positionName}
            sx={{
              backgroundColor:
                TYPE_COLOR_OVERRIDES[type] ?? colorMapDisplay[departmentName],
              textDecoration: "line-through",
            }}
          />
          <Typography
            component="span"
            sx={{ color: "error.main", fontWeight: 700 }}
          >
            CANCELED
          </Typography>
        </Box>
      ) : (
        <Chip
          key={`${timePositionId}-chip`}
          label={positionName}
          sx={{
            backgroundColor:
              TYPE_COLOR_OVERRIDES[type] ?? colorMapDisplay[departmentName],
          }}
        />
      );
      // SQUAD / LEAD badge appended to the end of the Position cell
      const badge = shiftBadge(positionName);
      const positionCellBadged = (
        <Box
          key={`${timePositionId}-position-badged`}
          sx={{ alignItems: "center", display: "flex", gap: 1 }}
        >
          {positionCell}
          {badge && (
            <Box
              alt={badge.alt}
              component="img"
              src={badge.src}
              sx={{ display: "block", height: 26, width: "auto" }}
            />
          )}
        </Box>
      );

      return [
        formatDateName(date, dateName),
        formatTime(startTime, endTime),
        positionName,
        positionCellBadged,

        // if volunteer is admin
        // then display volunteer shift review and volunteer menu
        isAdmin ? (
          <IconButton
            onClick={() => {
              setDialogCurrent({
                dialogItem: DialogList.Review,
                shift: {
                  date,
                  dateName,
                  endTime,
                  positionName,
                  startTime,
                  timeId: 0,
                  timePositionId,
                },
                volunteer: {
                  noShow: "",
                  notes,
                  rating,
                },
              });
              setIsDialogOpen(true);
            }}
          >
            {rating ? (
              <ChatIcon color="primary" />
            ) : (
              <ChatIcon color="disabled" />
            )}
          </IconButton>
        ) : (
          actionsLinks
        ),
        isAdmin && actionsLinks,
      ];
    }
  );
  const shiftDateCurrent = "";
  let shiftDateToggle = false;
  const optionListCustom = {
    setRowProps: (row: string[]) => {
      if (row[0] !== shiftDateCurrent) {
        shiftDateToggle = !shiftDateToggle;
      }

      return {
        sx: {
          backgroundColor: shiftDateToggle
            ? lighten(theme.palette.secondary.main, 0.9)
            : theme.palette.common.white,
        },
      };
    },
    sortOrder: {
      direction: "asc" as const,
      name: "Date",
    },
  };

  // calendar view of the user's own shifts (event week only, no navigation).
  // filled/total are 0 — this lists only the user's shifts, so the "X / Y
  // filled" line is omitted by ShiftsCalendar (per stickybeak 2026-07-19).
  const calendarEvents: ICalendarEvent[] = data.map(
    ({
      department: { name: departmentName },
      shift: { canceled, date, endTime, positionName, startTime, timeId, type },
    }: IResVolunteerShiftItem) => ({
      id: timeId,
      date,
      startTime,
      endTime,
      type: type || positionName,
      filled: 0,
      total: 0,
      canceled,
      eligible: true,
      isMine: false,
      lockedReason: "",
      color: TYPE_COLOR_OVERRIDES[type] ?? colorMapDisplay[departmentName],
    })
  );

  // Open a printable, time-grid version of the schedule in a new window.
  const handlePrint = () => {
    const printName = worldName || playaName;
    const html = buildSchedulePrintHtml({
      events: calendarEvents,
      title: printName ? `${printName}'s Schedule` : "My Schedule",
      origin: window.location.origin,
    });
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      enqueueSnackbar(
        <SnackbarText>
          Please allow pop-ups for this site to print your schedule.
        </SnackbarText>,
        { variant: "error" }
      );
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Stack
        alignItems="flex-end"
        direction="row"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography component="h2" variant="h4">
          My Shifts
        </Typography>
        <Button
          onClick={() => {
            router.push("/shifts");
          }}
          startIcon={<EventAvailableIcon />}
          type="button"
          variant="contained"
        >
          Add shift
        </Button>
      </Stack>
      {/* Whole My Shifts body on one continuous white card — the note, the
          view controls, and the calendar/table (per papabear 2026-07-22). */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography sx={{ mb: 2 }}>
            If you are looking to schedule a shift with a friend, make sure you
            both select the same time and day in your account.
          </Typography>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Button
              onClick={handlePrint}
              size="small"
              startIcon={<PrintIcon />}
              type="button"
              variant="outlined"
            >
              Print my Schedule
            </Button>
            <ToggleButtonGroup
              color="primary"
              exclusive
              onChange={(_, nextView) => {
                if (nextView) setView(nextView);
              }}
              size="small"
              value={view}
            >
              <ToggleButton value="calendar">
                <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />
                Calendar
              </ToggleButton>
              <ToggleButton value="table">
                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          {view === "calendar" ? (
            <ShiftsCalendar
              events={calendarEvents}
              layout="time"
              onSelect={(id) => router.push(`/shifts/${id}/volunteers`)}
            />
          ) : (
            <DataTable
              columnList={columnList}
              dataTable={dataTable}
              optionListCustom={optionListCustom}
            />
          )}
        </CardContent>
      </Card>

      {/* remove dialog */}
      <VolunteerShiftsDialogRemove
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Remove && isDialogOpen
        }
        shift={dialogCurrent.shift}
        volunteer={{ shiftboardId }}
      />

      {/* review dialog */}
      <VolunteerShiftsDialogReview
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Review && isDialogOpen
        }
        shift={dialogCurrent.shift}
        volunteer={{
          notes: dialogCurrent.volunteer.notes,
          rating: dialogCurrent.volunteer.rating,
          shiftboardId,
        }}
      />
    </>
  );
};
