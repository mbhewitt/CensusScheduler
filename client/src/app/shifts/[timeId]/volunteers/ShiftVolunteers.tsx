"use client";

import {
  Chat as ChatIcon,
  Groups3 as Groups3Icon,
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz as MoreHorizIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
  PersonRemove as PersonRemoveIcon,
  WorkHistory as WorkHistoryIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { MUIDataTableColumn } from "mui-datatables";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { Fragment, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useSWR, { KeyedMutator } from "swr";
import useSWRMutation from "swr/mutation";

import { FormattedText } from "@/components/general/FormattedText";
import { ShiftVolunteersDialogAdd } from "@/app/shifts/[timeId]/volunteers/ShiftVolunteersDialogAdd";
import { ShiftVolunteersDialogRemove } from "@/app/shifts/[timeId]/volunteers/ShiftVolunteersDialogRemove";
import { ShiftVolunteersDialogReview } from "@/app/shifts/[timeId]/volunteers/ShiftVolunteersDialogReview";
import { BreadcrumbsNav } from "@/components/general/BreadcrumbsNav";
import { DataTable } from "@/components/general/DataTable";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { MoreMenu } from "@/components/general/MoreMenu";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type { IReqSwitchValues, ISwitchValues } from "@/components/types";
import type {
  IResShiftPositionCountItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "@/components/types/shifts";
import {
  ADD_SHIFT_VOLUNTEER_RES,
  GATE_OPEN_ISO,
  REMOVE_SHIFT_VOLUNTEER_RES,
  SHIFT_DURING,
  SHIFT_FUTURE,
  SHIFT_PAST,
  TOGGLE_CHECK_IN_REQ,
  TOGGLE_CHECK_IN_RES,
  UPDATE_REVIEW_RES,
  UPDATE_TYPE_CAMP_ADDRESS,
  UPDATE_TYPE_CHECK_IN,
  UPDATE_TYPE_TABLET_NUMBER,
  UPDATE_TYPE_TABLET_RETURNED,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import {
  checkIsAdmin,
  checkIsAuthenticated,
  checkIsPeersCoordinator,
  checkIsPeersShiftLead,
  checkIsSuperAdmin,
} from "@/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";
import { getCheckInType } from "@/utils/getCheckInType";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "@/utils/setCellPropsCenter";

enum DialogList {
  Add,
  Remove,
  Review,
}
interface IShiftVolunteersProps {
  timeId: number;
}
interface IDialogCurrentState {
  dialogItem: number;
  shift: {
    positionName: string;
    timePositionId: number;
  };
  volunteer: {
    notes: string;
    playaName: string;
    rating: null | number;
    shiftboardId: number;
    worldName: string;
  };
}

const socket = io();
export const ShiftVolunteers = ({
  timeId: timeIdParam,
}: IShiftVolunteersProps) => {
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
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { roleList, shiftboardId: shiftboardIdSession },
    },
  } = useContext(SessionContext);

  // state
  // ------------------------------------------------------------
  const [dialogCurrent, setDialogCurrent] = useState<IDialogCurrentState>({
    dialogItem: 0,
    shift: {
      positionName: "",
      timePositionId: 0,
    },
    volunteer: {
      notes: "",
      playaName: "",
      rating: null,
      shiftboardId: 0,
      worldName: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // PEERS tablet camp-address popup (papabear 2026-07-26) — declared here with
  // the other hooks so it stays above the loading/error early returns below.
  const [campAddressDialog, setCampAddressDialog] = useState<{
    open: boolean;
    shiftboardId: number;
    playaName: string;
    worldName: string;
    value: string;
  }>({ open: false, shiftboardId: 0, playaName: "", worldName: "", value: "" });

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data: dataShiftVolunteersItem,
    error: errorShiftVolunteersItem,
    mutate: mutateShiftVolunteersItem,
  }: {
    data: IResShiftVolunteerInformation;
    error: Error | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutate: KeyedMutator<any>;
  } = useSWR(`/api/shifts/${timeIdParam}/volunteers`, fetcherGet);
  const { trigger } = useSWRMutation(
    `/api/shifts/${timeIdParam}/volunteers`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // ------------------------------------------------------------
  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on(
          ADD_SHIFT_VOLUNTEER_RES,
          ({
            isCheckedIn,
            isWalkIn,
            notes,
            playaName,
            positionName,
            rating,
            shiftboardId,
            timePositionId,
            worldName,
          }) => {
            if (dataShiftVolunteersItem) {
              const dataMutate = structuredClone(dataShiftVolunteersItem);
              dataMutate.volunteerList.push({
                campAddress: "",
                isCheckedIn,
                isOpenCamping: false,
                isWalkIn,
                notes,
                playaName,
                positionName,
                rating,
                shiftboardId,
                tabletNumber: null,
                tabletReturned: false,
                timePositionId,
                worldName,
              });

              mutateShiftVolunteersItem(dataMutate);
            }
          }
        );
        socket.on(
          TOGGLE_CHECK_IN_RES,
          ({
            checked,
            shiftboardId,
          }: {
            checked: boolean;
            shiftboardId: number;
          }) => {
            if (dataShiftVolunteersItem) {
              const dataMutate = structuredClone(dataShiftVolunteersItem);
              const shiftVolunteerItemUpdate = dataMutate.volunteerList.find(
                (volunteerItem: IResShiftVolunteerRowItem) =>
                  volunteerItem.shiftboardId === shiftboardId
              );
              if (shiftVolunteerItemUpdate) {
                shiftVolunteerItemUpdate.isCheckedIn = checked ? "" : "Yes";
              }

              mutateShiftVolunteersItem(dataMutate);
            }
          }
        );
        socket.on(
          UPDATE_REVIEW_RES,
          ({
            notes,
            rating,
            shiftboardId,
          }: {
            notes: string;
            rating: number;
            shiftboardId: number;
          }) => {
            if (dataShiftVolunteersItem) {
              const dataMutate = structuredClone(dataShiftVolunteersItem);
              const shiftVolunteerItemUpdate = dataMutate.volunteerList.find(
                (volunteerItem: IResShiftVolunteerRowItem) =>
                  volunteerItem.shiftboardId === shiftboardId
              );
              if (shiftVolunteerItemUpdate) {
                shiftVolunteerItemUpdate.notes = notes;
                shiftVolunteerItemUpdate.rating = rating;
              }

              mutateShiftVolunteersItem(dataMutate);
            }
          }
        );
        socket.on(REMOVE_SHIFT_VOLUNTEER_RES, ({ shiftboardId }) => {
          if (dataShiftVolunteersItem) {
            const dataMutate = structuredClone(dataShiftVolunteersItem);
            const volunteerListNew = dataMutate.volunteerList.filter(
              (volunteerItem: IResShiftVolunteerRowItem) =>
                volunteerItem.shiftboardId !== shiftboardId
            );
            dataMutate.volunteerList = volunteerListNew;

            mutateShiftVolunteersItem(dataMutate);
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
  }, [dataShiftVolunteersItem, enqueueSnackbar, mutateShiftVolunteersItem]);

  // logic
  // ------------------------------------------------------------
  if (errorShiftVolunteersItem) return <ErrorPage />;
  if (!dataShiftVolunteersItem) return <Loading />;

  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const isAdmin = checkIsAdmin(accountType, roleList);
  const isSuperAdmin = checkIsSuperAdmin(accountType, roleList);
  const isPeersCoordinator = checkIsPeersCoordinator(roleList);
  const isPeersShiftLead = checkIsPeersShiftLead(roleList);
  // World name + Check-in columns are for leadership only — hidden from plain
  // Squaddies (per stickybeak 2026-07-19).
  const canSeeVolunteerDetails =
    isAdmin || isSuperAdmin || isPeersCoordinator || isPeersShiftLead;
  // PEERS: the "Returned" tablet toggle stays locked until Gate open — tablets
  // aren't handed back before the event starts (papabear 2026-07-26). Real
  // wall-clock, matching the app's other GATE_OPEN_ISO checks (VolunteerInfo,
  // TabletAgreement) and the server-side enforcement on this update type.
  const isBeforeGateOpen = new Date() < new Date(GATE_OPEN_ISO);

  const handleCheckInToggle = async ({
    shift: { positionName, timePositionId },
    volunteer: { isCheckedIn, playaName, shiftboardId, worldName },
  }: ISwitchValues) => {
    const body: IReqSwitchValues = {
      isCheckedIn,
      shiftboardId,
      timePositionId,
      updateType: UPDATE_TYPE_CHECK_IN,
    };

    try {
      // fetcherTrigger doesn't throw on non-2xx, so surface a server
      // rejection (e.g. 403 from the check-in role/time gate) explicitly
      // — otherwise it would read as a false success and still broadcast.
      const result = await trigger({
        body,
        method: "PATCH",
      });
      if (result?.statusCode && result.statusCode >= 400) {
        throw new Error(result.message ?? "Check-in update failed.");
      }
      socket.emit(TOGGLE_CHECK_IN_REQ, {
        isCheckedIn,
        shiftboardId,
        timePositionId,
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          for <strong>{positionName}</strong> has{" "}
          <strong>checked {isCheckedIn ? "in" : "out"}</strong>
        </SnackbarText>,
        {
          variant: "success",
        }
      );
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
  };

  // PEERS tablet tracking (papabear 2026-07-26). Leadership records the tablet
  // number, flips "returned", and fills an open camper's camp address inline
  // (no navigating to the account page). All three are leadership-gated server
  // side; a refetch keeps the "Needs Address" state and values current.
  const handleTabletPatch = async (body: {
    shiftboardId: number;
    updateType: string;
    timePositionId?: number;
    tabletNumber?: number | null;
    tabletReturned?: boolean;
    campAddress?: string;
  }) => {
    try {
      const result = await trigger({ body, method: "PATCH" });
      if (result?.statusCode && result.statusCode >= 400) {
        throw new Error(result.message ?? "Update failed.");
      }
      mutateShiftVolunteersItem();
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          { persist: true, variant: "error" }
        );
      }
    }
  };

  const handleCampAddressConfirm = async () => {
    await handleTabletPatch({
      shiftboardId: campAddressDialog.shiftboardId,
      updateType: UPDATE_TYPE_CAMP_ADDRESS,
      campAddress: campAddressDialog.value,
    });
    setCampAddressDialog((prev) => ({ ...prev, open: false }));
  };

  // evaluate the check-in type and available features
  const checkInType = getCheckInType({
    dateTime: dayjs(dateTimeValue),
    endTime: dayjs(dataShiftVolunteersItem.shift.endTime),
    startTime: dayjs(dataShiftVolunteersItem.shift.startTime),
  });
  const isShiftCanceled = Boolean(dataShiftVolunteersItem.shift.canceled);
  // the current user's own signup on this shift, if any — drives the
  // self-service "Drop Shift" button (shown only when they're signed up).
  // Self-removal stays available even on a canceled shift.
  const currentUserVolunteer = dataShiftVolunteersItem.volunteerList.find(
    (volunteerItem) => volunteerItem.shiftboardId === shiftboardIdSession
  );
  let isVolunteerAddAvailable = false;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      isVolunteerAddAvailable =
        isAdmin ||
        (isAuthenticated &&
          dataShiftVolunteersItem.positionList.some(
            (positionItem: IResShiftPositionCountItem) =>
              positionItem.slotsTotal - positionItem.slotsFilled > 0
          ));
      break;
    }
    case SHIFT_DURING: {
      isVolunteerAddAvailable = true;
      break;
    }
    case SHIFT_PAST: {
      isVolunteerAddAvailable = isAdmin;
      break;
    }
    default: {
      throw new Error(`Unknown check-in type: ${checkInType}`);
    }
  }
  // PEERS: Check-in unlocks at Gate open (matching the "Returned" tablet
  // toggle), not during the shift's own time window — leadership only
  // (papabear 2026-07-27). Server-enforced in checkCheckInAuthorized.
  let isCheckInAvailable =
    (isAdmin || isPeersCoordinator || isPeersShiftLead) && !isBeforeGateOpen;
  // Canceled shifts: no one (including admins) can add volunteers
  // via this page — they have to flip the canceled flag back off
  // in the Update Time dialog first. Self-removes (the DataTable's
  // row-level remove buttons) are intentionally still available so
  // already-assigned volunteers can drop themselves, which fires
  // the cancellation .ics if they hadn't already gotten one.
  if (isShiftCanceled) {
    isVolunteerAddAvailable = false;
    isCheckInAvailable = false;
  }

  // prepare datatable positions
  const columnListPositions = [
    {
      name: "Name",
      options: { sortThirdClickReset: true },
    },
    {
      name: "Filled / Total",
      options: {
        sort: false,
      },
    },
  ];
  // Participation points (PPP) are an admin/audit-only figure now — hidden
  // from participants across the app (per papabear 2026-07-17), so the
  // column only appears for admins on the shift roster.
  if (isAdmin) {
    columnListPositions.push({
      name: "PPP",
      options: {
        sort: false,
      },
    });
  }
  const dataTablePositions = dataShiftVolunteersItem.positionList.map(
    ({
      csp,
      positionName,
      slotsFilled,
      slotsTotal,
    }: IResShiftPositionCountItem) => {
      return isAdmin
        ? [positionName, `${slotsFilled} / ${slotsTotal}`, csp]
        : [positionName, `${slotsFilled} / ${slotsTotal}`];
    }
  );
  const optionListCustomPositions = {
    filter: false,
    pagination: false,
    search: false,
    sortOrder: {
      direction: "asc" as const,
      name: "Name",
    },
  };

  // prepare datatable volunteers
  const columnListVolunteers: MUIDataTableColumn[] = [
    {
      name: "Playa name",
      options: { filter: false, sortThirdClickReset: true },
    },
    {
      name: "World name",
      options: {
        display: canSeeVolunteerDetails ? true : "excluded",
        filter: false,
        sortThirdClickReset: true,
      },
    },
    {
      // Cap the Position width to ~"PEERS Squaddie" and ellipsis the rest (the
      // "(in the field)" tail can be cut off) — papabear 2026-07-26.
      name: "Position",
      options: {
        setCellProps: () => ({
          style: {
            maxWidth: "9rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        }),
        sortThirdClickReset: true,
      },
    },
    {
      // PEERS tablet #: leadership-only editable cell, recorded at check-in.
      // Sortable on screen (papabear 2026-07-26): the cell's raw value is the
      // number so the header sorts numerically, while customBodyRenderLite
      // draws the editable field from the original row (dataIndex-keyed, so it
      // stays correct after a sort). Blank tablet #s sort as the lowest value.
      name: "Tablet #",
      options: {
        customBodyRenderLite: (dataIndex: number) => {
          const volunteerItem =
            dataShiftVolunteersItem.volunteerList[dataIndex];
          if (!volunteerItem) return null;

          const { shiftboardId, timePositionId, tabletNumber } = volunteerItem;
          return (
            <TextField
              defaultValue={tabletNumber ?? ""}
              disabled={!canSeeVolunteerDetails}
              inputProps={{
                max: 99,
                min: 0,
                style: { textAlign: "center", width: "3rem" },
              }}
              key={`${shiftboardId}-tablet-number`}
              onBlur={(event) => {
                const raw = event.target.value.trim();
                const next = raw === "" ? null : Number(raw);
                if (next !== (tabletNumber ?? null)) {
                  handleTabletPatch({
                    shiftboardId,
                    timePositionId,
                    updateType: UPDATE_TYPE_TABLET_NUMBER,
                    tabletNumber: next,
                  });
                }
              }}
              type="number"
              variant="standard"
            />
          );
        },
        display: canSeeVolunteerDetails ? true : "excluded",
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: true,
        sortCompare:
          (order: string) =>
          (a: { data: number | string }, b: { data: number | string }) => {
            const toValue = (raw: number | string) =>
              raw === "" || raw == null ? -1 : Number(raw);
            const diff = toValue(a.data) - toValue(b.data);

            return order === "asc" ? diff : -diff;
          },
      },
    },
    {
      name: "Check in",
      options: {
        display: canSeeVolunteerDetails ? true : "excluded",
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
    {
      // PEERS "Needs Address": checked = open camper with no camp address on
      // file; click it to fill the address inline. Leadership-only.
      name: "Needs Address",
      options: {
        display: canSeeVolunteerDetails ? true : "excluded",
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
    {
      // PEERS "Returned": leadership toggle when the tablet comes back.
      name: "Returned",
      options: {
        display: canSeeVolunteerDetails ? true : "excluded",
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
    {
      // PEERS #walkin: read-only indicator — checked when the volunteer is
      // on a Squaddie shift without the Squaddie role (no Hive training).
      // Leadership-only, same as Check in / World name.
      name: "Walk-In",
      options: {
        display: canSeeVolunteerDetails ? true : "excluded",
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
  ];
  if (isAdmin) {
    columnListVolunteers.push(
      {
        name: "Admin review",
        options: {
          filter: false,
          searchable: false,
          setCellHeaderProps: setCellHeaderPropsCenter,
          setCellProps: setCellPropsCenter,
          sort: false,
        },
      },
      {
        name: "Admin actions",
        options: {
          filter: false,
          searchable: false,
          setCellHeaderProps: setCellHeaderPropsCenter,
          setCellProps: setCellPropsCenter,
          sort: false,
        },
      }
    );
  }
  const dataTableVolunteers = dataShiftVolunteersItem.volunteerList.map(
    ({
      campAddress,
      isCheckedIn,
      isOpenCamping,
      isWalkIn,
      notes,
      playaName,
      positionName,
      rating,
      shiftboardId,
      tabletNumber,
      tabletReturned,
      timePositionId,
      worldName,
    }: IResShiftVolunteerRowItem) => {
      const needsAddress = isOpenCamping && campAddress.trim() === "";
      return [
        playaName,
        worldName,
        positionName,
        // Tablet #: raw value for sorting/search; the editable field is drawn
        // by the column's customBodyRenderLite (papabear 2026-07-26).
        tabletNumber ?? "",
        <Switch
          checked={isCheckedIn === ""}
          disabled={!isCheckInAvailable}
          onChange={(event) =>
            handleCheckInToggle({
              shift: {
                positionName,
                timePositionId,
              },
              volunteer: {
                isCheckedIn: event.target.checked,
                playaName,
                shiftboardId,
                worldName,
              },
            })
          }
          key={`${shiftboardId}-shift-volunteer`}
        />,
        // PEERS "Needs Address": checked = open camper with no address on file.
        // Only clickable while checked — an unchecked box (address already on
        // file) is disabled and does nothing, so it can't open an empty popup
        // (papabear 2026-07-26). Clicking a checked box opens the inline
        // camp-address popup (preventDefault so the box itself doesn't toggle).
        <Checkbox
          checked={needsAddress}
          disabled={!canSeeVolunteerDetails || !needsAddress}
          key={`${shiftboardId}-needs-address`}
          onClick={(event) => {
            event.preventDefault();
            setCampAddressDialog({
              open: true,
              playaName,
              shiftboardId,
              value: campAddress,
              worldName,
            });
          }}
          sx={{ "&.Mui-checked": { color: "warning.main" } }}
        />,
        // PEERS "Returned": leadership toggle when the tablet comes back.
        // Locked until Gate open (papabear 2026-07-26) — tablets can't be
        // returned before the event.
        <Switch
          checked={tabletReturned}
          disabled={!canSeeVolunteerDetails || isBeforeGateOpen}
          key={`${shiftboardId}-tablet-returned`}
          onChange={(event) =>
            handleTabletPatch({
              shiftboardId,
              timePositionId,
              tabletReturned: event.target.checked,
              updateType: UPDATE_TYPE_TABLET_RETURNED,
            })
          }
        />,
        // PEERS #walkin: read-only checkbox — checked = walk-in (no Squaddie
        // role / no Hive training). Disabled so leads can't toggle it; it's
        // auto-derived from the volunteer's current roles. The checked state
        // renders green (sx override, since a disabled checkbox would
        // otherwise grey out) so walk-ins stand out at a glance (papabear
        // 2026-07-23).
        <Checkbox
          checked={isWalkIn}
          disabled
          key={`${shiftboardId}-walk-in`}
          sx={{ "&.Mui-checked.Mui-disabled": { color: "success.main" } }}
        />,
        // if volunteer is admin
        // then display volunteer shift review and volunteer menu
        isAdmin && (
          <IconButton
            onClick={() => {
              setDialogCurrent({
                dialogItem: DialogList.Review,
                shift: {
                  positionName,
                  timePositionId,
                },
                volunteer: {
                  notes,
                  playaName,
                  rating,
                  shiftboardId,
                  worldName,
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
        ),
        isAdmin && (
          <MoreMenu
            Icon={<MoreHorizIcon />}
            key={`${shiftboardId}-menu`}
            MenuList={
              <MenuList>
                <Link href={`/volunteers/${shiftboardId}/info`}>
                  <MenuItem>
                    <ListItemIcon>
                      <ManageAccountsIcon />
                    </ListItemIcon>
                    <ListItemText>View account</ListItemText>
                  </MenuItem>
                </Link>
                <MenuItem
                  onClick={() => {
                    setDialogCurrent({
                      dialogItem: DialogList.Remove,
                      shift: {
                        positionName,
                        timePositionId,
                      },
                      volunteer: {
                        notes: "",
                        playaName,
                        rating: null,
                        shiftboardId,
                        worldName,
                      },
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <ListItemIcon>
                    <PersonRemoveIcon />
                  </ListItemIcon>
                  <ListItemText>Remove volunteer</ListItemText>
                </MenuItem>
              </MenuList>
            }
          />
        ),
      ];
    }
  );
  const optionListCustomVolunteers = {
    // Hide the filter (funnel) icon on the volunteers table for everyone — our
    // shifts only have one position type, so it isn't useful (per stickybeak
    // 2026-07-19).
    filter: false,
    sortOrder: {
      direction: "asc" as const,
      name: "Playa name",
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
        text="Shift volunteers"
      />
      <Container component="main">
        <Box component="section">
          <BreadcrumbsNav>
            <Link href="/shifts">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <WorkHistoryIcon sx={{ mr: 0.5 }} />
                Shifts
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <Groups3Icon sx={{ mr: 0.5 }} />
              Shift volunteers
            </Typography>
          </BreadcrumbsNav>
        </Box>
        <Box component="section">
          {isShiftCanceled && (
            <Alert
              severity="error"
              sx={{ mb: 2, "& .MuiAlert-message": { fontWeight: 700 } }}
            >
              CANCELED — this shift has been canceled. New assignments are
              disabled. Volunteers already on the shift can still remove
              themselves.
            </Alert>
          )}
          <Box>
            <Typography
              component="h2"
              variant="h4"
              sx={{
                mb: 2,
                ...(isShiftCanceled && {
                  color: "text.disabled",
                  textDecoration: "line-through",
                }),
              }}
            >
              {formatDateName(
                dataShiftVolunteersItem.shift.date,
                dataShiftVolunteersItem.shift.dateName
              )}
              <br />
              {formatTime(
                dataShiftVolunteersItem.shift.startTime,
                dataShiftVolunteersItem.shift.endTime
              )}
              <br />
              {dataShiftVolunteersItem.shift.typeName}
            </Typography>
          </Box>
          {/*
           * Suppress any row whose right-column value is empty so we
           * don't render a lonely "Meal" or "Notes" label with nothing
           * after it (closes #234). Especially relevant for "Meal" —
           * Chipper: don't rub it in that a shift earns no meal. If
           * none of the three has content the whole Card collapses.
           */}
          {(() => {
            const detailRows = [
              {
                label: "Details",
                value: dataShiftVolunteersItem.shift.details,
              },
              { label: "Meal", value: dataShiftVolunteersItem.shift.meal },
              { label: "Notes", value: dataShiftVolunteersItem.shift.notes },
            ].filter((row) => row.value && String(row.value).trim() !== "");
            if (detailRows.length === 0) return null;
            return (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container>
                    {detailRows.map((row, index) => (
                      <Fragment key={row.label}>
                        {index > 0 && (
                          <Grid size={12}>
                            <Divider sx={{ my: 2 }} />
                          </Grid>
                        )}
                        <Grid size={2}>
                          <Typography component="h3" variant="h6">
                            {row.label}
                          </Typography>
                        </Grid>
                        <Grid size={10}>
                          <FormattedText text={String(row.value)} />
                        </Grid>
                      </Fragment>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            );
          })()}
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Positions
          </Typography>
          <DataTable
            columnList={columnListPositions}
            dataTable={dataTablePositions}
            optionListCustom={optionListCustomPositions}
          />
        </Box>
        <Box component="section">
          <Stack
            alignItems="flex-end"
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography component="h2" variant="h4">
              Volunteers
            </Typography>
            <Stack direction="row" spacing={1}>
              {/* self-service drop — only shown when the current user is
                  signed up for this shift; reuses the remove dialog */}
              {currentUserVolunteer && (
                <Button
                  onClick={() => {
                    setDialogCurrent({
                      dialogItem: DialogList.Remove,
                      shift: {
                        positionName: currentUserVolunteer.positionName,
                        timePositionId: currentUserVolunteer.timePositionId,
                      },
                      volunteer: {
                        notes: "",
                        playaName: currentUserVolunteer.playaName,
                        rating: null,
                        shiftboardId: currentUserVolunteer.shiftboardId,
                        worldName: currentUserVolunteer.worldName,
                      },
                    });
                    setIsDialogOpen(true);
                  }}
                  startIcon={<PersonRemoveIcon />}
                  type="button"
                  variant="contained"
                >
                  Drop Shift
                </Button>
              )}
              <Button
                disabled={!isVolunteerAddAvailable}
                onClick={() => {
                  setDialogCurrent({
                    dialogItem: DialogList.Add,
                    shift: {
                      positionName: "",
                      timePositionId: 0,
                    },
                    volunteer: {
                      notes: "",
                      playaName: "",
                      rating: null,
                      shiftboardId: 0,
                      worldName: "",
                    },
                  });
                  setIsDialogOpen(true);
                }}
                startIcon={<PersonAddAlt1Icon />}
                type="button"
                variant="contained"
              >
                Claim Shift
              </Button>
            </Stack>
          </Stack>
          <DataTable
            columnList={columnListVolunteers}
            dataTable={dataTableVolunteers}
            optionListCustom={optionListCustomVolunteers}
          />
        </Box>

        {/* add dialog */}
        <ShiftVolunteersDialogAdd
          checkInType={checkInType}
          handleDialogClose={() => setIsDialogOpen(false)}
          isDialogOpen={
            dialogCurrent.dialogItem === DialogList.Add && isDialogOpen
          }
          shiftVolunteersItem={{
            ...dataShiftVolunteersItem,
            timeId: timeIdParam,
          }}
        />

        {/* remove dialog */}
        <ShiftVolunteersDialogRemove
          handleDialogClose={() => setIsDialogOpen(false)}
          isDialogOpen={
            dialogCurrent.dialogItem === DialogList.Remove && isDialogOpen
          }
          isSelfRemoval={
            dialogCurrent.volunteer.shiftboardId === shiftboardIdSession
          }
          shift={{
            ...dialogCurrent.shift,
            date: dataShiftVolunteersItem.shift.date,
            dateName: dataShiftVolunteersItem.shift.dateName,
            endTime: dataShiftVolunteersItem.shift.endTime,
            startTime: dataShiftVolunteersItem.shift.startTime,
            timeId: timeIdParam,
          }}
          volunteer={dialogCurrent.volunteer}
        />

        {/* review dialog */}
        <ShiftVolunteersDialogReview
          handleDialogClose={() => setIsDialogOpen(false)}
          isDialogOpen={
            dialogCurrent.dialogItem === DialogList.Review && isDialogOpen
          }
          shift={{ ...dialogCurrent.shift, timeId: timeIdParam }}
          volunteer={dialogCurrent.volunteer}
        />
        {/* PEERS camp-address popup (papabear 2026-07-26): leadership fills an
            open camper's camp address inline from the Shift Volunteers page. */}
        <Dialog
          fullWidth
          maxWidth="sm"
          onClose={() =>
            setCampAddressDialog((prev) => ({ ...prev, open: false }))
          }
          open={campAddressDialog.open}
        >
          <DialogTitle>
            Camp address — {campAddressDialog.playaName} &quot;
            {campAddressDialog.worldName}&quot;
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Camp Address"
              onChange={(event) =>
                setCampAddressDialog((prev) => ({
                  ...prev,
                  value: event.target.value,
                }))
              }
              sx={{ mt: 1 }}
              value={campAddressDialog.value}
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setCampAddressDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button onClick={handleCampAddressConfirm} variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};
