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
import { ShiftVolunteersDialogAdd } from "src/components/shift-volunteers/ShiftVolunteersDialogAdd";
import { ShiftVolunteersDialogRemove } from "src/components/shift-volunteers/ShiftVolunteersDialogRemove";
import {
  IDataPositionItem,
  IDataShiftVolunteerItem,
} from "src/components/types";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkInGet } from "src/utils/checkInGet";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { positionItemFirstGet } from "src/utils/positionItemFirstGet";

interface ISwitchValues {
  checked: boolean;
  playaName: string;
  position: string;
  shiftboardId: number;
  shiftPositionId: string;
  worldName: string;
}

const socket = io();
export const ShiftVolunteers = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { isCoreCrew },
    },
  } = useContext(SessionContext);
  const {
    developerModeState: {
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogAddOpen, setIsDialogAddOpen] = useState(false);
  const [isDialogRemoveOpen, setIsDialogRemoveOpen] = useState({
    isOpen: false,
    volunteer: {
      playaName: "",
      position: "",
      shiftboardId: 0,
      shiftPositionId: "",
      worldName: "",
    },
  });
  const router = useRouter();
  const { shiftId } = router.query;
  const {
    data: dataShiftVolunteerList,
    error: errorShiftVolunteerList,
    mutate: mutateShiftVolunteerList,
  } = useSWR(isMounted ? `/api/shift-volunteers/${shiftId}` : null, fetcherGet);
  const { trigger } = useSWRMutation(
    `/api/shift-volunteers/${shiftId}`,
    fetcherTrigger
  );
  const { enqueueSnackbar } = useSnackbar();

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
            position,
            shiftPositionid,
            shiftboardId,
            worldName,
          }) => {
            if (dataShiftVolunteerList) {
              const dataMutate = structuredClone(dataShiftVolunteerList);
              dataMutate.shiftVolunteerList.push({
                noShow,
                playaName,
                position,
                shiftPositionid,
                shiftboardId,
                worldName,
              });

              mutateShiftVolunteerList(dataMutate);
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
            if (dataShiftVolunteerList) {
              const dataMutate = structuredClone(dataShiftVolunteerList);
              const shiftboardIdNum = Number(shiftboardId);
              const shiftVolunteerItemUpdate =
                dataMutate.shiftVolunteerList.find(
                  (volunteerItem: IDataShiftVolunteerItem) =>
                    volunteerItem.shiftboardId === shiftboardIdNum
                );
              if (shiftVolunteerItemUpdate) {
                shiftVolunteerItemUpdate.noShow = checked ? "" : "Yes";
              }

              mutateShiftVolunteerList(dataMutate);
            }
          }
        );
        socket.on("res-shift-volunteer-remove", ({ shiftboardId }) => {
          if (dataShiftVolunteerList) {
            const dataMutate = structuredClone(dataShiftVolunteerList);
            const volunteerListNew = dataMutate.shiftVolunteerList.filter(
              (volunteerItem: IDataShiftVolunteerItem) =>
                volunteerItem.shiftboardId !== shiftboardId
            );
            dataMutate.shiftVolunteerList = volunteerListNew;

            mutateShiftVolunteerList(dataMutate);
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
  }, [dataShiftVolunteerList, enqueueSnackbar, mutateShiftVolunteerList]);

  if (errorShiftVolunteerList) return <ErrorPage />;
  if (!dataShiftVolunteerList) return <Loading />;

  // handle check in toggle
  const handleCheckInToggle = async ({
    checked,
    playaName,
    position,
    shiftboardId,
    shiftPositionId,
    worldName,
  }: ISwitchValues) => {
    try {
      await trigger({
        body: {
          checked,
          shiftPositionId,
          shiftboardId,
        },
        method: "PATCH",
      });
      socket.emit("req-check-in-toggle", {
        checked,
        shiftboardId,
        shiftPositionId,
      });
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          for <strong>{position}</strong> has{" "}
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
  const checkInType = checkInGet({
    dateTime: dateTimeValue,
    endTime: dayjs(dataShiftVolunteerList.endTime),
    startTime: dayjs(dataShiftVolunteerList.startTime),
  });
  let isVolunteerAddAvailable = false;
  let isCheckInAvailable = false;

  switch (checkInType) {
    case SHIFT_FUTURE: {
      isVolunteerAddAvailable =
        (isAuthenticated && isCoreCrew) ||
        (isAuthenticated &&
          dataShiftVolunteerList.positionList.some(
            (positionItem: IDataPositionItem) => positionItem.freeSlots > 0
          ));
      break;
    }
    case SHIFT_DURING: {
      isVolunteerAddAvailable = true;
      isCheckInAvailable = true;
      break;
    }
    case SHIFT_PAST: {
      isVolunteerAddAvailable = isAuthenticated && isCoreCrew;
      isCheckInAvailable = isAuthenticated && isCoreCrew;
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
      options: { filter: false, searchable: false, sort: false },
    },
  ];
  if (isAuthenticated && isCoreCrew) {
    columnList.push({
      name: "Admin",
      options: { filter: false, searchable: false, sort: false },
    });
  }
  const volunteerListDataTable = structuredClone(
    dataShiftVolunteerList.shiftVolunteerList
  );
  const dataTable = volunteerListDataTable.map(
    ({
      noShow,
      playaName,
      position,
      shiftboardId,
      shiftPositionId,
      worldName,
    }: IDataShiftVolunteerItem) => {
      return [
        playaName,
        worldName,
        position,
        <Switch
          checked={noShow === ""}
          disabled={!isCheckInAvailable}
          onChange={(event) =>
            handleCheckInToggle({
              checked: event.target.checked,
              playaName,
              position,
              shiftboardId,
              shiftPositionId,
              worldName,
            })
          }
          key={`${shiftboardId}-switch`}
        />,
        // if volunteer is authenticated and is core crew
        // then display volunteer shift volunteer menu
        isAuthenticated && isCoreCrew && (
          <MoreMenu
            Icon={<MoreHorizIcon />}
            key={`${shiftboardId}-menu`}
            MenuList={
              <MenuList>
                <Link href={`/volunteers/${shiftboardId}`}>
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
                        position,
                        shiftboardId,
                        shiftPositionId,
                        worldName,
                      },
                    })
                  }
                >
                  <ListItemIcon>
                    <PersonRemoveIcon />
                  </ListItemIcon>
                  <ListItemText>Remove</ListItemText>
                </MenuItem>
              </MenuList>
            }
          />
        ),
      ];
    }
  );
  const optionListCustom = {};

  return (
    <>
      <Hero
        Image={
          <Image
            alt="census volunteers gathering"
            fill
            priority
            src="/shift-volunteers/hero.jpg"
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
                  textDecoration: "underline",
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
                {dataShiftVolunteerList.dateName} {dataShiftVolunteerList.date}
                <br />
                {dataShiftVolunteerList.shift}
                <br />
                {dataShiftVolunteerList.shortName}
              </Typography>
              <Typography component="h3" variant="h6">
                {dataShiftVolunteerList.positionList.map(
                  ({ freeSlots, position, totalSlots }: IDataPositionItem) => {
                    return (
                      <Fragment key={position}>
                        {position}: {totalSlots - freeSlots} / {totalSlots}
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

                // if there are less than or equal to zero slots available, display warning notification
                const positionItemFirstDisplay = positionItemFirstGet(
                  dataShiftVolunteerList.positionList
                );

                if (positionItemFirstDisplay.freeSlots <= 0) {
                  enqueueSnackbar(
                    <SnackbarText>
                      There are{" "}
                      <strong>{positionItemFirstDisplay.freeSlots}</strong>{" "}
                      openings available for{" "}
                      <strong>{positionItemFirstDisplay.position}</strong>
                    </SnackbarText>,
                    {
                      variant: "warning",
                    }
                  );
                }
              }}
              startIcon={<PersonAddIcon />}
              type="button"
              variant="contained"
            >
              Add
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
          date={dataShiftVolunteerList.date}
          dateName={dataShiftVolunteerList.dateName}
          endTime={dataShiftVolunteerList.endTime}
          handleDialogAddClose={() => setIsDialogAddOpen(false)}
          isDialogAddOpen={isDialogAddOpen}
          positionList={dataShiftVolunteerList.positionList}
          shift={dataShiftVolunteerList.shift}
          shiftId={shiftId}
          shiftVolunteerList={dataShiftVolunteerList.shiftVolunteerList}
          startTime={dataShiftVolunteerList.startTime}
        />

        {/* remove dialog */}
        <ShiftVolunteersDialogRemove
          handleDialogRemoveClose={() =>
            setIsDialogRemoveOpen({
              isOpen: false,
              volunteer: {
                playaName: "",
                position: "",
                shiftboardId: 0,
                shiftPositionId: "",
                worldName: "",
              },
            })
          }
          isDialogRemoveOpen={isDialogRemoveOpen.isOpen}
          shiftId={shiftId}
          volunteer={isDialogRemoveOpen.volunteer}
        />
      </Container>
    </>
  );
};
