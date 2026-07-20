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
  Container,
  Divider,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Switch,
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
  REMOVE_SHIFT_VOLUNTEER_RES,
  SHIFT_DURING,
  SHIFT_FUTURE,
  SHIFT_PAST,
  TOGGLE_CHECK_IN_REQ,
  TOGGLE_CHECK_IN_RES,
  UPDATE_REVIEW_RES,
  UPDATE_TYPE_CHECK_IN,
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
      user: { roleList },
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
                isCheckedIn,
                notes,
                playaName,
                positionName,
                rating,
                shiftboardId,
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

  // evaluate the check-in type and available features
  const checkInType = getCheckInType({
    dateTime: dayjs(dateTimeValue),
    endTime: dayjs(dataShiftVolunteersItem.shift.endTime),
    startTime: dayjs(dataShiftVolunteersItem.shift.startTime),
  });
  const isShiftCanceled = Boolean(dataShiftVolunteersItem.shift.canceled);
  let isVolunteerAddAvailable = false;
  let isCheckInAvailable = false;

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
      // Check-in during the live shift: PEERS Shift Leads, PEERS
      // Coordinators, and Admins (papabear 2026-07-16).
      isCheckInAvailable = isAdmin || isPeersCoordinator || isPeersShiftLead;
      break;
    }
    case SHIFT_PAST: {
      isVolunteerAddAvailable = isAdmin;
      // Check-in after the shift: PEERS Coordinators and Admins only.
      isCheckInAvailable = isAdmin || isPeersCoordinator;
      break;
    }
    default: {
      throw new Error(`Unknown check-in type: ${checkInType}`);
    }
  }
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
    { name: "Position", options: { sortThirdClickReset: true } },
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
      isCheckedIn,
      notes,
      playaName,
      positionName,
      rating,
      shiftboardId,
      timePositionId,
      worldName,
    }: IResShiftVolunteerRowItem) => {
      return [
        playaName,
        worldName,
        positionName,
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
          shift={{ ...dialogCurrent.shift, timeId: timeIdParam }}
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
      </Container>
    </>
  );
};
