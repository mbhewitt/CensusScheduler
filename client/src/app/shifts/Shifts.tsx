"use client";

import {
  CalendarMonth as CalendarMonthIcon,
  CheckBox as CheckBoxIcon,
  Lock as LockIcon,
  ViewList as ViewListIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Container,
  FormControl,
  InputLabel,
  lighten,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { MUIDataTableColumn } from "mui-datatables";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import useSWR from "swr";
import { useImmer } from "use-immer";

import {
  ShiftsCalendar,
  type ICalendarEvent,
} from "@/app/shifts/ShiftsCalendar";
import { DataTable } from "@/components/general/DataTable";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { Hero } from "@/components/layout/Hero";
import type { IResShiftRowItem } from "@/components/types/shifts";
import type { IResVolunteerShiftItem } from "@/components/types/volunteers";
import {
  ROLE_PEERS_COORDINATOR_ID,
  ROLE_PEERS_SHIFT_LEAD_ID,
  ROLE_PEERS_SQUADDIE_ID,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin, checkIsRoleExist } from "@/utils/checkIsRoleExist";
import { fetcherGet } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";
import { getColorMap, TYPE_COLOR_OVERRIDES } from "@/utils/getColorMap";
import { shiftBadge } from "@/utils/shiftBadge";

// Which access role a shift type requires to sign up. Returns null for shift
// types with no gating (open to any signed-in volunteer). The PEERS access
// roles are granted by completing the corresponding Hive training, so gating
// signup on them also enforces "finish training first" (per papabear
// 2026-07-17).
const requiredRoleForType = (
  type: string
): { id: number; label: string } | null => {
  if (/lead/i.test(type)) {
    return { id: ROLE_PEERS_SHIFT_LEAD_ID, label: "PEERS Lead" };
  }
  if (/coordinator|pcoc|pcio/i.test(type)) {
    return { id: ROLE_PEERS_COORDINATOR_ID, label: "PEERS Coordinator" };
  }
  if (/squaddie/i.test(type)) {
    return { id: ROLE_PEERS_SQUADDIE_ID, label: "PEERS Squaddie" };
  }
  return null;
};

export const Shifts = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType, dateTime: { value: dateTimeValue } },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { roleList, shiftboardId },
    },
  } = useContext(SessionContext);

  // Whether the signed-in volunteer may sign up for a given shift type. Admins
  // bypass; PEERS Leads may also take Squaddie shifts. Untrained volunteers
  // (no PEERS access role) are ineligible everywhere → the whole list grays
  // out, which nudges them to finish Hive training first.
  const isEligibleForType = (type: string): boolean => {
    if (checkIsAdmin(accountType, roleList)) return true;
    const required = requiredRoleForType(type);
    if (!required) return true;
    const hasSquaddie = checkIsRoleExist(ROLE_PEERS_SQUADDIE_ID, roleList);
    const hasLead = checkIsRoleExist(ROLE_PEERS_SHIFT_LEAD_ID, roleList);
    // Shift Lead shifts require BOTH trainings — the Squaddie role AND the
    // Shift Lead role (each earned from its Hive confirmation link), per
    // papabear 2026-07-17.
    if (required.id === ROLE_PEERS_SHIFT_LEAD_ID) {
      return hasLead && hasSquaddie;
    }
    // Squaddie shifts: anyone who's completed Squaddie training (Leads too).
    if (required.id === ROLE_PEERS_SQUADDIE_ID) {
      return hasSquaddie || hasLead;
    }
    // Other types (e.g. Coordinator): the single matching role.
    return checkIsRoleExist(required.id, roleList);
  };

  // Whether a shift type is even VISIBLE to the signed-in volunteer (separate
  // from eligibility/graying). Coordinator shifts show only to Coordinators;
  // Shift Lead shifts show to Shift Leads (and Coordinators, who see all four);
  // Squaddie shifts show to everyone. Admins see all. (per papabear 2026-07-17)
  const isTypeVisible = (type: string): boolean => {
    if (checkIsAdmin(accountType, roleList)) return true;
    const hasCoordinator = checkIsRoleExist(
      ROLE_PEERS_COORDINATOR_ID,
      roleList
    );
    const hasLead = checkIsRoleExist(ROLE_PEERS_SHIFT_LEAD_ID, roleList);
    if (/coordinator|pcoc|pcio/i.test(type)) return hasCoordinator;
    if (/lead/i.test(type)) return hasLead || hasCoordinator;
    return true;
  };

  // state
  // ------------------------------------------------------------
  const [view, setView] = useState<"calendar" | "table">("calendar");
  // Calendar-view filters (Type + availability). The table has its own
  // built-in filters; these mirror them for the calendar (per papabear
  // 2026-07-17). Empty typeFilter = all types.
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "open" | "full"
  >("all");
  const columnNameDateHidden = "Date - hidden";
  const columnNameDate = "Date";
  const columnNameTypeHidden = "Type - hidden";
  const [columnList, setColumnList] = useImmer<MUIDataTableColumn[]>([
    {
      name: "Shift times ID - hidden", // hide for row click
      options: {
        display: false,
        filter: false,
      },
    },
    {
      name: columnNameDateHidden, // hide for filter dialog
      label: "Timeline",
      options: {
        display: false,
        filterList: ["Present / Future"],
        filterOptions: {
          names: ["Present / Future", "Past"],
        },
      },
    },
    {
      name: columnNameDate,
      options: {
        sortThirdClickReset: true,
        sortCompare: (order: string) => {
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shift1: { [key: string]: any },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shift2: { [key: string]: any }
          ) => {
            const dateTime1 = shift1.rowData[1];
            const dateTime2 = shift2.rowData[1];

            return dayjs(dateTime1).isAfter(dayjs(dateTime2)) && order === "asc"
              ? 1
              : -1;
          };
        },
      },
    },
    {
      name: "Time",
      options: { filter: false, sortThirdClickReset: true },
    },
    {
      name: columnNameTypeHidden, // hide for filter dialog
      label: "Type",
      options: {
        display: false,
      },
    },
    {
      name: "Type",
      options: {
        filter: false,
        sortThirdClickReset: true,
        sortCompare: (order: string) => {
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shift1: { [key: string]: any },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shift2: { [key: string]: any }
          ) => {
            // Sort by the raw type string (hidden Type column, rowData[4]) so
            // sorting is independent of the rendered cell's structure (the
            // eligibility wrapper below is not a bare Chip with a `label`).
            const type1 = shift1.rowData[4];
            const type2 = shift2.rowData[4];

            return type1 > type2 && order === "asc" ? 1 : -1;
          };
        },
      },
    },
    {
      name: "My shifts",
      options: {
        filter: false,
        searchable: false,
        setCellHeaderProps: () => ({ style: { textAlign: "center" } }),
        setCellProps: () => ({ style: { textAlign: "center" } }),
        sort: false,
      },
    },
    {
      name: "Filled / Total",
      options: {
        // Underlying value stays "<filled> / <total>" so the filter logic
        // below and the existing Date-row alternation (which sorts by
        // string) keep working. customBodyRender just transforms the cell
        // *display*: highlight the filled count in pink + bold when the
        // shift still has open slots (Mew, 2026-05-25).
        customBodyRender: (value: string) => {
          const [filledStr, totalStr] = value.split(" / ");
          const filled = Number(filledStr);
          const total = Number(totalStr);
          const isOpen = filled < total;
          if (!isOpen) return value;
          return (
            <span>
              <span
                style={{
                  color: theme.palette.secondary.main,
                  fontWeight: 700,
                }}
              >
                {filledStr}
              </span>
              {` / ${totalStr}`}
            </span>
          );
        },
        filterOptions: {
          logic: (value: string, filterValue: string[]) => {
            const [filled, total] = value
              .split(" / ")
              .map((string) => Number(string));
            const show =
              (filterValue.indexOf("Full") >= 0 && filled >= total) ||
              (filterValue.indexOf("Open") >= 0 && filled < total);

            // returning false means that the value will display
            return !show;
          },
          names: ["Full", "Open"],
        },
        sort: false,
      },
    },
  ]);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IResShiftRowItem[];
    error: Error | undefined;
  } = useSWR("/api/shifts", fetcherGet);

  // The signed-in volunteer's own signups — used to mark shifts they're already
  // on (per stickybeak 2026-07-19). Skipped for walk-ups with no session.
  const { data: myShifts } = useSWR<IResVolunteerShiftItem[]>(
    shiftboardId ? `/api/volunteers/${shiftboardId}/shifts` : null,
    fetcherGet
  );
  const myShiftTimeIds = new Set((myShifts ?? []).map((s) => s.shift.timeId));

  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();
  const theme = useTheme();

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    // if filter list state is stored in session storage
    // then update column list state with filter list state
    const filterListStateStorage = JSON.parse(
      sessionStorage.getItem("filterListState") ?? "[]"
    );

    if (filterListStateStorage.length > 0) {
      setColumnList((prevColumnList) =>
        prevColumnList.forEach((prevColumnItem, index) => {
          if (prevColumnItem.options) {
            prevColumnItem.options.filterList = filterListStateStorage[index];
          }
        })
      );
    }
  }, [setColumnList]);
  useEffect(() => {
    const dateTimeActive = dateTimeValue ?? dayjs();

    // if dateTimeValue updates
    // then update filter logic for "Date - hidden" column
    setColumnList((prevColumnList) => {
      prevColumnList.forEach((prevColumnItem) => {
        if (
          prevColumnItem.name === columnNameDateHidden &&
          prevColumnItem.options &&
          prevColumnItem.options.filterOptions
        ) {
          prevColumnItem.options.filterOptions.logic = (
            dateHiddenValue: string,
            filterValue: string[]
          ) => {
            const show =
              (filterValue.indexOf("Present / Future") >= 0 &&
                dayjs(dateHiddenValue).isSameOrAfter(dateTimeActive, "date")) ||
              (filterValue.indexOf("Past") >= 0 &&
                dayjs(dateHiddenValue).isBefore(dateTimeActive, "date"));

            // returning false means that the value will display
            return !show;
          };
        }
      });
    });
  }, [dateTimeValue, setColumnList]);
  useEffect(() => {
    // if data exists
    // then customize the filter options display for date and type columns
    if (data) {
      const dateFilterList: string[] = [];
      const typeFilterList: string[] = [];

      data.forEach(({ date, dateName, type }) => {
        dateFilterList.push(
          dateName ? formatDateName(date, dateName) : formatDateName(date)
        );
        // Only offer the Type filter for types the volunteer can see.
        if (isTypeVisible(type)) typeFilterList.push(type);
      });

      const dateFilterListDisplay = [...new Set(dateFilterList)];
      const typeFilterListDisplay = [...new Set(typeFilterList)].sort();

      setColumnList((prevColumnList) =>
        prevColumnList.forEach((prevColumnItem) => {
          if (prevColumnItem.options) {
            switch (prevColumnItem.name) {
              case columnNameDate:
                prevColumnItem.options.filterOptions = {
                  ...prevColumnItem.options.filterOptions,
                  names: dateFilterListDisplay,
                };
                break;
              case columnNameTypeHidden:
                prevColumnItem.options.filterOptions = {
                  ...prevColumnItem.options.filterOptions,
                  names: typeFilterListDisplay,
                };
                break;
              default:
            }
          }
        })
      );
    }
    // NB: isTypeVisible is deliberately not a dep — it changes identity each
    // render and this effect writes a fresh filterOptions object, so adding it
    // would loop. Role rarely changes mid-session; options refresh on data.
  }, [data, setColumnList]);

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  dayjs.extend(isSameOrAfter);

  // Hide shift types the volunteer isn't entitled to see (role-based), before
  // building either view — applies to both the table and the calendar.
  const visibleData = data.filter((shift) => isTypeVisible(shift.type));

  // prepare datatable
  const colorMapDisplay = getColorMap(data);
  const dataTable = visibleData.map(
    ({
      canceled,
      date,
      dateName,
      department: { name: departmentName },
      endTime,
      id,
      slotsFilled,
      slotsTotal,
      startTime,
      type,
    }) => {
      const eligible = isEligibleForType(type);
      const required = requiredRoleForType(type);
      const baseChip = (
        <Chip
          key={`${id}-chip`}
          label={type}
          sx={{
            backgroundColor:
              TYPE_COLOR_OVERRIDES[type] ?? colorMapDisplay[departmentName],
          }}
        />
      );
      const typeCell = canceled ? (
        <Box
          key={`${id}-type`}
          sx={{ alignItems: "center", display: "flex", gap: 1 }}
        >
          <Chip
            label={type}
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
      ) : eligible ? (
        baseChip
      ) : (
        <Tooltip
          key={`${id}-locked`}
          title={
            required?.id === ROLE_PEERS_SHIFT_LEAD_ID
              ? "Requires completing both the Squaddie and Shift Lead Hive trainings to sign up"
              : `Requires the ${required?.label} role — complete your Hive training to sign up`
          }
        >
          <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
            <LockIcon fontSize="small" sx={{ color: "text.disabled" }} />
            {baseChip}
          </Box>
        </Tooltip>
      );
      // SQUAD / LEAD badge appended to the end of the Type cell
      const badge = shiftBadge(type);
      const typeCellBadged = (
        <Box
          key={`${id}-type-badged`}
          sx={{ alignItems: "center", display: "flex", gap: 1 }}
        >
          {typeCell}
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
        id, // hide for row click
        // Full start datetime (not just the date): drives BOTH the
        // Present/Future-vs-Past filter (compared at "date" granularity) and
        // the default Date-column sort, which now orders by date THEN start
        // time within a day (per Mew 2026-07-17). Falls back to `date` if a
        // row somehow has no start time.
        startTime || date,
        formatDateName(date, dateName),
        formatTime(startTime, endTime),
        type, // hide for filter dialog
        typeCellBadged,
        myShiftTimeIds.has(id) ? (
          <CheckBoxIcon
            key={`${id}-mine`}
            color="success"
            fontSize="small"
            titleAccess="You are signed up for this shift"
          />
        ) : (
          ""
        ),
        `${slotsFilled} / ${slotsTotal}`,
      ];
    }
  );

  // calendar events — same eligibility / color logic as the table
  const calendarEvents: ICalendarEvent[] = visibleData.map((shift) => {
    const eligible = isEligibleForType(shift.type);
    const required = requiredRoleForType(shift.type);
    return {
      id: shift.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      type: shift.type,
      filled: shift.slotsFilled,
      total: shift.slotsTotal,
      canceled: shift.canceled,
      eligible,
      isMine: myShiftTimeIds.has(shift.id),
      lockedReason: eligible
        ? ""
        : required?.id === ROLE_PEERS_SHIFT_LEAD_ID
          ? "Requires completing both the Squaddie and Shift Lead Hive trainings to sign up"
          : `Requires the ${required?.label} role — complete your Hive training to sign up`,
      color:
        TYPE_COLOR_OVERRIDES[shift.type] ??
        colorMapDisplay[shift.department.name] ??
        theme.palette.grey[300],
    };
  });

  const distinctTypes = [...new Set(visibleData.map((s) => s.type))].sort();
  const filteredCalendarEvents = calendarEvents.filter((e) => {
    const typeOk = typeFilter.length === 0 || typeFilter.includes(e.type);
    const availabilityOk =
      availabilityFilter === "all" ||
      (availabilityFilter === "open" && e.filled < e.total) ||
      (availabilityFilter === "full" && e.filled >= e.total);
    return typeOk && availabilityOk;
  });

  let shiftDateCurrent = "";
  let shiftDateToggle = false;
  const optionListCustom = {
    onFilterChange: (
      _: MUIDataTableColumn | null | string,
      filterList: string[][]
    ) => {
      sessionStorage.setItem("filterListState", JSON.stringify(filterList));
    },
    onRowClick: (row: string[]) => {
      // row[4] = raw shift type. Ineligible shifts are grayed out and not
      // clickable — signup requires the matching PEERS access role.
      if (!isEligibleForType(row[4])) return;
      router.push(`/shifts/${row[0]}/volunteers`);
    },
    rowHover: true,
    search: false,
    setRowProps: (row: string[]) => {
      if (row[2] !== shiftDateCurrent) {
        [, , shiftDateCurrent] = row;
        shiftDateToggle = !shiftDateToggle;
      }

      const eligible = isEligibleForType(row[4]);
      return {
        sx: {
          backgroundColor: shiftDateToggle
            ? lighten(theme.palette.secondary.main, 0.9)
            : theme.palette.common.white,
          cursor: eligible ? "pointer" : "not-allowed",
          opacity: eligible ? 1 : 0.5,
        },
      };
    },
    sortFilterList: false,
    sortOrder: {
      direction: "asc" as const,
      name: "Date",
    },
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/peers-footwash.jpg)",
          backgroundSize: "cover",
        }}
        text="All Shifts"
      />
      <Container component="main">
        <Alert severity="warning" sx={{ my: 2 }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            Complete your PEERS onboarding first.
          </Typography>{" "}
          You must finish your Hive training and the full onboarding process
          before signing up for shifts. Shifts you aren&rsquo;t yet eligible for
          are grayed out, and sign-ups made before onboarding is complete may be
          removed.
        </Alert>
        {/* view toggle + calendar filters (Type + availability) */}
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box>
            {view === "calendar" && (
              <Box>
                <Typography
                  sx={{ fontWeight: 700, mb: 0.5, textAlign: "center" }}
                >
                  Filters
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  <FormControl size="small" sx={{ minWidth: 170 }}>
                    <Select<string[]>
                      displayEmpty
                      input={<OutlinedInput />}
                      multiple
                      onChange={(e) =>
                        setTypeFilter(e.target.value as string[])
                      }
                      renderValue={(selected) =>
                        selected.length === 0
                          ? "Type: All"
                          : `Type: ${selected.length}`
                      }
                      value={typeFilter}
                    >
                      {distinctTypes.map((t) => (
                        <MenuItem key={t} value={t}>
                          <Checkbox checked={typeFilter.includes(t)} />
                          <ListItemText primary={t} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="calendar-availability-label">
                      Availability
                    </InputLabel>
                    <Select
                      label="Availability"
                      labelId="calendar-availability-label"
                      onChange={(e) =>
                        setAvailabilityFilter(
                          e.target.value as "all" | "open" | "full"
                        )
                      }
                      value={availabilityFilter}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="open">Open only</MenuItem>
                      <MenuItem value="full">Full only</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}
          </Box>
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
        </Box>
        <Box component="section">
          {view === "calendar" ? (
            <ShiftsCalendar
              events={filteredCalendarEvents}
              onSelect={(id) => router.push(`/shifts/${id}/volunteers`)}
            />
          ) : (
            <DataTable
              columnList={columnList}
              dataTable={dataTable}
              optionListCustom={optionListCustom}
            />
          )}
        </Box>
      </Container>
    </>
  );
};
