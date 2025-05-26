"use client";

import {
  Groups3 as Groups3Icon,
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz as MoreHorizIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
  PersonRemove as PersonRemoveIcon,
  Reviews as ReviewsIcon,
  WorkHistory as WorkHistoryIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid2 as Grid,
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
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useSWR, { KeyedMutator } from "swr";
import useSWRMutation from "swr/mutation";

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
  const dataTablePositions = dataShiftVolunteersItem.positionList.map(
    ({ positionName, slotsFilled, slotsTotal }: IResShiftPositionCountItem) => {
      return [positionName, `${slotsFilled} / ${slotsTotal}`];
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
              <ReviewsIcon color="primary" />
            ) : (
              <ReviewsIcon color="disabled" />
            )}
          </IconButton>
        ),
        isAdmin && (
          <MoreMenu
            Icon={<MoreHorizIcon />}
            key={`${shiftboardId}-menu`}
            MenuList={
              <MenuList>
                <Link href={`/volunteers/${shiftboardId}/account`}>
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
          backgroundImage: "url(/banners/databeast-volunteers-waving.jpg)",
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
          <Box>
            <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
              {formatDateName(
                dataShiftVolunteersItem.shift.startTime,
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
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container>
                <Grid size={2}>
                  <Typography component="h3" variant="h6">
                    Details
                  </Typography>
                </Grid>
                <Grid size={10}>{dataShiftVolunteersItem.shift.details}</Grid>
                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid size={2}>
                  <Typography component="h3" variant="h6">
                    Meal
                  </Typography>
                </Grid>
                <Grid size={10}>{dataShiftVolunteersItem.shift.meal}</Grid>
                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid size={2}>
                  <Typography component="h3" variant="h6">
                    Notes
                  </Typography>
                </Grid>
                <Grid size={10}>{dataShiftVolunteersItem.shift.notes}</Grid>
              </Grid>
            </CardContent>
          </Card>
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
              Add volunteer
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
