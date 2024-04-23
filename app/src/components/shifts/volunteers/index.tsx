import {
  CalendarMonth as CalendarMonthIcon,
  Groups3 as Groups3Icon,
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz as MoreHorizIcon,
  PersonAdd as PersonAddIcon,
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
  const [isDialogAddOpen, setIsDialogAddOpen] = useState(false);
  const [isDialogRemoveOpen, setIsDialogRemoveOpen] = useState({
    isOpen: false,
    volunteer: {
      playaName: "",
      positionName: "",
      shiftboardId: 0,
      shiftPositionId: 0,
      timeId: 0,
      worldName: "",
    },
  });

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { timeId: shiftTimesQuery } = router.query;
  const {
    data: dataShiftVolunteerItem,
    error: errorShiftVolunteerItem,
    mutate: mutateShiftVolunteerItem,
  } = useSWR(
    isMounted ? `/api/shifts/volunteers/${shiftTimesQuery}` : null,
    fetcherGet
  );
  const { trigger } = useSWRMutation(
    `/api/shifts/volunteers/${shiftTimesQuery}`,
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
            if (dataShiftVolunteerItem) {
              const dataMutate = structuredClone(dataShiftVolunteerItem);
              dataMutate.shiftVolunteerList.push({
                noShow,
                playaName,
                positionName,
                shiftboardId,
                shiftPositionId,
                timeId,
                worldName,
              });

              mutateShiftVolunteerItem(dataMutate);
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
            if (dataShiftVolunteerItem) {
              const dataMutate = structuredClone(dataShiftVolunteerItem);
              const shiftboardIdNum = Number(shiftboardId);
              const shiftVolunteerItemUpdate =
                dataMutate.shiftVolunteerList.find(
                  (volunteerItem: IResShiftVolunteerItem) =>
                    volunteerItem.shiftboardId === shiftboardIdNum
                );
              if (shiftVolunteerItemUpdate) {
                shiftVolunteerItemUpdate.noShow = checked ? "" : "Yes";
              }

              mutateShiftVolunteerItem(dataMutate);
            }
          }
        );
        socket.on("res-shift-volunteer-remove", ({ shiftboardId }) => {
          if (dataShiftVolunteerItem) {
            const dataMutate = structuredClone(dataShiftVolunteerItem);
            const volunteerListNew = dataMutate.shiftVolunteerList.filter(
              (volunteerItem: IResShiftVolunteerItem) =>
                volunteerItem.shiftboardId !== shiftboardId
            );
            dataMutate.shiftVolunteerList = volunteerListNew;

            mutateShiftVolunteerItem(dataMutate);
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
  }, [dataShiftVolunteerItem, enqueueSnackbar, mutateShiftVolunteerItem]);

  // logic
  // --------------------
  if (errorShiftVolunteerItem) return <ErrorPage />;
  if (!dataShiftVolunteerItem) return <Loading />;

  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const isAdmin = checkIsAdmin(accountType, roleList);

  // handle check in toggle
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
    endTime: dayjs(dataShiftVolunteerItem.endTime),
    startTime: dayjs(dataShiftVolunteerItem.startTime),
  });
  let isVolunteerAddAvailable = false;
  let isCheckInAvailable = false;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      isVolunteerAddAvailable =
        (isAuthenticated && isAdmin) ||
        (isAuthenticated &&
          dataShiftVolunteerItem.shiftPositionList.some(
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
    dataShiftVolunteerItem.shiftVolunteerList
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
                  onClick={() =>
                    setIsDialogRemoveOpen({
                      isOpen: true,
                      volunteer: {
                        playaName,
                        positionName,
                        shiftboardId,
                        shiftPositionId,
                        timeId,
                        worldName,
                      },
                    })
                  }
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
                  dataShiftVolunteerItem.date,
                  dataShiftVolunteerItem.dateName
                )}
                <br />
                {formatTime(
                  dataShiftVolunteerItem.startTime,
                  dataShiftVolunteerItem.endTime
                )}
                <br />
                {dataShiftVolunteerItem.type}
              </Typography>
              <Typography component="h3" variant="h6">
                {dataShiftVolunteerItem.shiftPositionList.map(
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
                setIsDialogAddOpen(true);
              }}
              startIcon={<PersonAddIcon />}
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
          date={dataShiftVolunteerItem.date}
          dateName={dataShiftVolunteerItem.dateName}
          endTime={dataShiftVolunteerItem.endTime}
          handleDialogAddClose={() => setIsDialogAddOpen(false)}
          isDialogAddOpen={isDialogAddOpen}
          shiftPositionList={dataShiftVolunteerItem.shiftPositionList}
          timeId={shiftTimesQuery}
          shiftVolunteerList={dataShiftVolunteerItem.shiftVolunteerList}
          startTime={dataShiftVolunteerItem.startTime}
          type={dataShiftVolunteerItem.type}
        />

        {/* remove dialog */}
        <ShiftVolunteersDialogRemove
          handleDialogRemoveClose={() =>
            setIsDialogRemoveOpen({
              isOpen: false,
              volunteer: {
                playaName: "",
                positionName: "",
                shiftboardId: 0,
                shiftPositionId: 0,
                timeId: 0,
                worldName: "",
              },
            })
          }
          isDialogRemoveOpen={isDialogRemoveOpen.isOpen}
          volunteer={isDialogRemoveOpen.volunteer}
        />
      </Container>
    </>
  );
};
