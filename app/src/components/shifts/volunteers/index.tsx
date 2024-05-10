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
  Container,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { Fragment, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import { ShiftVolunteersDialogAdd } from "src/components/shifts/volunteers/ShiftVolunteersDialogAdd";
import { ShiftVolunteersDialogRemove } from "src/components/shifts/volunteers/ShiftVolunteersDialogRemove";
import type {
  IResShiftPositionItem,
  IResShiftVolunteerItem,
  ISwitchValues,
} from "src/components/types";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAdmin, checkIsAuthenticated } from "src/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { formatDateName, formatTime } from "src/utils/formatDateTime";
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
            noShow,
            playaName,
            positionName,
            shiftboardId,
            shiftPositionId,
            timeId,
            worldName,
          }) => {
            if (dataShiftVolunteersItem) {
              const dataMutate = structuredClone(dataShiftVolunteersItem);
              dataMutate.shiftVolunteerList.push({
                noShow,
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
              const shiftVolunteerItemUpdate =
                dataMutate.shiftVolunteerList.find(
                  (volunteerItem: IResShiftVolunteerItem) =>
                    volunteerItem.shiftboardId === shiftboardIdNum
                );
              if (shiftVolunteerItemUpdate) {
                shiftVolunteerItemUpdate.noShow = checked ? "" : "Yes";
              }

              mutateShiftVolunteersItem(dataMutate);
            }
          }
        );
        socket.on("res-shift-volunteer-remove", ({ shiftboardId }) => {
          if (dataShiftVolunteersItem) {
            const dataMutate = structuredClone(dataShiftVolunteersItem);
            const volunteerListNew = dataMutate.shiftVolunteerList.filter(
              (volunteerItem: IResShiftVolunteerItem) =>
                volunteerItem.shiftboardId !== shiftboardId
            );
            dataMutate.shiftVolunteerList = volunteerListNew;

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
    checked,
    playaName,
    positionName,
    shiftboardId,
    shiftPositionId,
    timeId,
    worldName,
  }: ISwitchValues) => {
    try {
      await trigger({
        body: {
          checked,
          shiftboardId,
          shiftPositionId,
          timeId,
        },
        method: "PATCH",
      });
      socket.emit("req-check-in-toggle", {
        checked,
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
          <strong>checked {checked ? "in" : "out"}</strong>
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
    endTime: dayjs(dataShiftVolunteersItem.endTime),
    startTime: dayjs(dataShiftVolunteersItem.startTime),
  });
  let isVolunteerAddAvailable = false;
  let isCheckInAvailable = false;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      isVolunteerAddAvailable =
        (isAuthenticated && isAdmin) ||
        (isAuthenticated &&
          dataShiftVolunteersItem.shiftPositionList.some(
            (positionItem: IResShiftPositionItem) =>
              positionItem.filledSlots > 0
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

  // prepare datatable
  const columnList = [
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
    columnList.push({
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
  const dataTable = structuredClone(
    dataShiftVolunteersItem.shiftVolunteerList
  ).map(
    ({
      noShow,
      playaName,
      positionName,
      shiftboardId,
      shiftPositionId,
      timeId,
      worldName,
    }: IResShiftVolunteerItem) => {
      return [
        playaName,
        worldName,
        positionName,
        <Switch
          checked={noShow === ""}
          disabled={!isCheckInAvailable}
          onChange={(event) =>
            handleCheckInToggle({
              checked: event.target.checked,
              playaName,
              positionName,
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
  const optionListCustom = {};

  // render
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="census volunteers gathering"
            fill
            priority
            src="/shifts/volunteers/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
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
          <Stack
            alignItems="flex-end"
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography component="h2" gutterBottom variant="h4">
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
              <Typography component="h3" variant="h6">
                {dataShiftVolunteersItem.shiftPositionList.map(
                  ({
                    filledSlots,
                    positionName,
                    totalSlots,
                  }: IResShiftPositionItem) => {
                    return (
                      <Fragment key={positionName}>
                        {positionName}: {filledSlots} / {totalSlots}
                        <br />
                      </Fragment>
                    );
                  }
                )}
              </Typography>
            </Box>
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
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
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
