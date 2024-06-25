import {
  CalendarMonth as CalendarMonthIcon,
  Groups3 as Groups3Icon,
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz as MoreHorizIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
  PersonRemove as PersonRemoveIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useSWR, { KeyedMutator } from "swr";
import useSWRMutation from "swr/mutation";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import { ShiftVolunteersDialogAdd } from "src/components/shifts/volunteers/ShiftVolunteersDialogAdd";
import { ShiftVolunteersDialogRemove } from "src/components/shifts/volunteers/ShiftVolunteersDialogRemove";
import type { ISwitchValues } from "src/components/types";
import type {
  IResShiftPositionCountItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "src/components/types/shifts";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAdmin, checkIsAuthenticated } from "src/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import {
  dateTimezone,
  formatDateName,
  formatTime,
} from "src/utils/formatDateTime";
import { getCheckInType } from "src/utils/getCheckInType";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

enum DialogList {
  Add,
  Remove,
}

const socket = io();
export const ShiftVolunteers = () => {
  // context
  // --------------------
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
  // --------------------
  const [isMounted, setIsMounted] = useState(false);
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    shift: {
      positionName: "",
      shiftPositionId: 0,
      timeId: 0,
    },
    volunteer: {
      playaName: "",
      shiftboardId: 0,
      worldName: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { timeId: timeIdQuery } = router.query;
  const {
    data: dataShiftVolunteersItem,
    error: errorShiftVolunteersItem,
    mutate: mutateShiftVolunteersItem,
  }: {
    data: IResShiftVolunteerInformation;
    error: Error | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutate: KeyedMutator<any>;
  } = useSWR(
    isMounted ? `/api/shifts/volunteers/${timeIdQuery}` : null,
    fetcherGet
  );
  const { trigger } = useSWRMutation(
    `/api/shifts/volunteers/${timeIdQuery}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // --------------------
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);

  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on(
          "res-shift-volunteer-add",
          ({
            isCheckedIn,
            playaName,
            positionName,
            shiftboardId,
            shiftPositionId,
            timeId,
            worldName,
          }) => {
            if (dataShiftVolunteersItem) {
              const dataMutate = structuredClone(dataShiftVolunteersItem);
              dataMutate.volunteerList.push({
                isCheckedIn,
                playaName,
                positionName,
                shiftboardId,
                shiftPositionId,
                timeId,
                worldName,
              });

              mutateShiftVolunteersItem(dataMutate);
            }
          }
        );
        socket.on(
          "res-check-in-toggle",
          ({
            checked,
            shiftboardId,
          }: {
            checked: boolean;
            shiftboardId: number | string;
          }) => {
            if (dataShiftVolunteersItem) {
              const dataMutate = structuredClone(dataShiftVolunteersItem);
              const shiftboardIdNum = Number(shiftboardId);
              const shiftVolunteerItemUpdate = dataMutate.volunteerList.find(
                (volunteerItem: IResShiftVolunteerRowItem) =>
                  volunteerItem.shiftboardId === shiftboardIdNum
              );
              if (shiftVolunteerItemUpdate) {
                shiftVolunteerItemUpdate.isCheckedIn = checked ? "" : "Yes";
              }

              mutateShiftVolunteersItem(dataMutate);
            }
          }
        );
        socket.on("res-shift-volunteer-remove", ({ shiftboardId }) => {
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
  // --------------------
  if (errorShiftVolunteersItem) return <ErrorPage />;
  if (!dataShiftVolunteersItem) return <Loading />;

  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const isAdmin = checkIsAdmin(accountType, roleList);

  const handleCheckInToggle = async ({
    isCheckedIn,
    playaName,
    position: { name: positionName },
    shiftboardId,
    shiftPositionId,
    timeId,
    worldName,
  }: ISwitchValues) => {
    try {
      await trigger({
        body: {
          isCheckedIn,
          shiftboardId,
          shiftPositionId,
          timeId,
        },
        method: "PATCH",
      });
      socket.emit("req-check-in-toggle", {
        isCheckedIn,
        shiftboardId,
        shiftPositionId,
        timeId,
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
    dateTime: dateTimezone(dateTimeValue),
    endTime: dateTimezone(dataShiftVolunteersItem.endTime),
    startTime: dateTimezone(dataShiftVolunteersItem.startTime),
  });
  let isVolunteerAddAvailable = false;
  let isCheckInAvailable = false;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      isVolunteerAddAvailable =
        (isAuthenticated && isAdmin) ||
        (isAuthenticated &&
          dataShiftVolunteersItem.positionList.some(
            (positionItem: IResShiftPositionCountItem) =>
              positionItem.totalSlots - positionItem.filledSlots > 0
          ));
      break;
    }
    case SHIFT_DURING: {
      isVolunteerAddAvailable = true;
      isCheckInAvailable = true;
      break;
    }
    case SHIFT_PAST: {
      isVolunteerAddAvailable = isAuthenticated && isAdmin;
      isCheckInAvailable = isAuthenticated && isAdmin;
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
    ({ filledSlots, positionName, totalSlots }: IResShiftPositionCountItem) => {
      return [positionName, `${filledSlots} / ${totalSlots}`];
    }
  );
  const optionListCustomPositions = {
    filter: false,
    pagination: false,
    search: false,
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
  if (isAuthenticated && isAdmin) {
    columnListVolunteers.push({
      name: "Admin",
      options: {
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    });
  }
  const dataTableVolunteers = dataShiftVolunteersItem.volunteerList.map(
    ({
      isCheckedIn,
      playaName,
      positionName,
      shiftboardId,
      shiftPositionId,
      timeId,
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
              isCheckedIn: event.target.checked,
              playaName,
              position: {
                name: positionName,
              },
              shiftboardId,
              shiftPositionId,
              timeId,
              worldName,
            })
          }
          key={`${shiftboardId}-switch`}
        />,
        // if volunteer is authenticated and is core crew
        // then display volunteer shift volunteer menu
        isAuthenticated && isAdmin && (
          <MoreMenu
            Icon={<MoreHorizIcon />}
            key={`${shiftboardId}-menu`}
            MenuList={
              <MenuList>
                <Link href={`/volunteers/account/${shiftboardId}`}>
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
                        shiftPositionId,
                        timeId,
                      },
                      volunteer: {
                        playaName,
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
  const optionListCustomVolunteers = {};

  // render
  // --------------------
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
          <Breadcrumbs>
            <Link href="/shifts">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <CalendarMonthIcon sx={{ mr: 0.5 }} />
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
          </Breadcrumbs>
        </Box>
        <Box component="section">
          <Box>
            <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
              {formatDateName(
                dataShiftVolunteersItem.date,
                dataShiftVolunteersItem.dateName
              )}
              <br />
              {formatTime(
                dataShiftVolunteersItem.startTime,
                dataShiftVolunteersItem.endTime
              )}
              <br />
              {dataShiftVolunteersItem.type}
            </Typography>
          </Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container>
                <Grid item xs={4}>
                  <Typography component="h3" variant="h6">
                    Details
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  {dataShiftVolunteersItem.details}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={4}>
                  <Typography component="h3" variant="h6">
                    Meal
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  {dataShiftVolunteersItem.meal}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={4}>
                  <Typography component="h3" variant="h6">
                    Notes
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  {dataShiftVolunteersItem.notes}
                </Grid>
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
                    shiftPositionId: 0,
                    timeId: 0,
                  },
                  volunteer: {
                    playaName: "",
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
          shiftVolunteersItem={dataShiftVolunteersItem}
          timeId={timeIdQuery}
        />

        {/* remove dialog */}
        <ShiftVolunteersDialogRemove
          handleDialogClose={() => setIsDialogOpen(false)}
          isDialogOpen={
            dialogCurrent.dialogItem === DialogList.Remove && isDialogOpen
          }
          shiftItem={dialogCurrent.shift}
          volunteerItem={dialogCurrent.volunteer}
        />
      </Container>
    </>
  );
};
