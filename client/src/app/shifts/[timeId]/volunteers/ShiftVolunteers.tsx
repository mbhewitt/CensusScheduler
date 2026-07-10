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
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs";
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
import { checkIsAdmin, checkIsAuthenticated } from "@/utils/checkIsRoleExist";
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
  // match the same 600px breakpoint the shared DataTable switches at
  const isMobile = useMediaQuery("(max-width:600px)");

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
      await trigger({
        body,
        method: "PATCH",
      });
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
      isCheckInAvailable = true;
      break;
    }
    case SHIFT_PAST: {
      isVolunteerAddAvailable = isAdmin;
      isCheckInAvailable = isAdmin;
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
    {
      name: "CSP",
      options: {
        filter: false,
        sort: false,
      },
    },
  ];
  const dataTablePositions = dataShiftVolunteersItem.positionList.map(
    ({
      csp,
      positionName,
      slotsFilled,
      slotsTotal,
    }: IResShiftPositionCountItem) => {
      return [positionName, `${slotsFilled} / ${slotsTotal}`, csp];
    }
  );
  const optionListCustomPositions = {
    filter: false,
    pagination: false,
    search: false,
    // No default sortOrder: the API already returns positions in priority
    // order (lead first, then non-lead critical, then the rest alphabetically).
    // Column headers stay clickable for ad-hoc re-sorting.
  };

  // prepare datatable volunteers
  const columnListVolunteers = [
    {
      name: "Playa name",
      options: { filter: false, sortThirdClickReset: true },
    },
    {
      name: "World name",
      options: { filter: false, sortThirdClickReset: true },
    },
    { name: "Position", options: { sortThirdClickReset: true } },
    {
      name: "Check in",
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
        // Check-in only appears once the shift's check-in window is open
        // (getCheckInType !== SHIFT_FUTURE); before that it's meaningless.
        isCheckInAvailable ? (
          <Switch
            checked={isCheckedIn === ""}
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
          />
        ) : (
          ""
        ),
        // if volunteer is admin AND check-in is open,
        // then display volunteer shift review and volunteer menu
        isAdmin && isCheckInAvailable && (
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
    // No default sortOrder: the API already returns the roster in priority
    // order (lead positions first, then non-lead critical, then the rest by
    // playa name). Column headers stay clickable for ad-hoc re-sorting.
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/databeast-volunteers-waving.jpg)",
          backgroundSize: "cover",
        }}
        text="Shift Detail"
      />
      <Container component="main">
        {isAdmin && (
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
                Shift Detail
              </Typography>
            </BreadcrumbsNav>
          </Box>
        )}
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
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <Typography component="h3" variant="h6">
                            {row.label}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 10 }}>
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
          {isMobile ? (
            <Stack spacing={1}>
              {dataShiftVolunteersItem.positionList.map(
                ({
                  csp,
                  positionName,
                  slotsFilled,
                  slotsTotal,
                }: IResShiftPositionCountItem) => (
                  <Box
                    key={`${positionName}-position-card`}
                    sx={{
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 2,
                      py: 1,
                    }}
                  >
                    {/* line 1: position name (bold) */}
                    <Typography sx={{ fontWeight: 700 }}>
                      {positionName}
                    </Typography>
                    {/* line 2: filled / total + CSP (secondary, no labels) */}
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {slotsFilled} / {slotsTotal} · CSP {csp}
                    </Typography>
                  </Box>
                )
              )}
            </Stack>
          ) : (
            <DataTable
              columnList={columnListPositions}
              dataTable={dataTablePositions}
              optionListCustom={optionListCustomPositions}
            />
          )}
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
              {isAdmin ? "Add volunteer" : "Add this shift"}
            </Button>
          </Stack>
          {isMobile ? (
            <Stack spacing={1}>
              {dataShiftVolunteersItem.volunteerList.map(
                ({
                  isCheckedIn,
                  notes,
                  playaName,
                  positionName,
                  rating,
                  shiftboardId,
                  timePositionId,
                  worldName,
                }: IResShiftVolunteerRowItem) => (
                  <Box
                    key={`${shiftboardId}-shift-volunteer-card`}
                    sx={{
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 2,
                      py: 1,
                    }}
                  >
                    {/* line 1: playa name (bold) + world name (secondary) */}
                    <Typography sx={{ fontWeight: 700 }}>
                      {playaName}
                      {worldName && worldName !== playaName && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "text.secondary", ml: 1 }}
                        >
                          &quot;{worldName}&quot;
                        </Typography>
                      )}
                    </Typography>
                    {/* line 2: position (secondary) + inline controls */}
                    <Stack
                      alignItems="center"
                      direction="row"
                      justifyContent="space-between"
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {positionName}
                      </Typography>
                      <Stack alignItems="center" direction="row">
                        {isCheckInAvailable && (
                          <Switch
                            checked={isCheckedIn === ""}
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
                          />
                        )}
                        {isAdmin && isCheckInAvailable && (
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
                        )}
                        {isAdmin && (
                          <MoreMenu
                            Icon={<MoreHorizIcon />}
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
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                )
              )}
            </Stack>
          ) : (
            <DataTable
              columnList={columnListVolunteers}
              dataTable={dataTableVolunteers}
              optionListCustom={optionListCustomVolunteers}
            />
          )}
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
