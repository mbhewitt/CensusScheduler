import {
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  Groups3 as Groups3Icon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  lighten,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DataTable } from "src/components/general/DataTable";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IResVolunteerShiftItem,
  ISwitchValues,
} from "src/components/types";
import { VolunteerShiftsDialogRemove } from "src/components/volunteer-shifts/VolunteerShiftsDialogRemove";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkIsAuthenticated } from "src/utils/checkIsAuthenticated";
import { checkIsCoreCrew } from "src/utils/checkIsCoreCrew";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { formatDateName, formatTime } from "src/utils/formatDateTime";
import { getCheckInType } from "src/utils/getCheckInType";
import { getColorMap } from "src/utils/getColorMap";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

const socket = io();
export const VolunteerShifts = () => {
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
      user: { roleList, playaName, worldName },
    },
  } = useContext(SessionContext);

  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogRemoveOpen, setIsDialogRemoveOpen] = useState({
    isOpen: false,
    shift: {
      date: "",
      dateName: "",
      endTime: "",
      positionName: "",
      shiftPositionId: 0,
      shiftTimesId: 0,
      startTime: "",
    },
  });

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { shiftboardId } = router.query;
  const { data, error, mutate } = useSWR(
    isMounted ? `/api/volunteer-shifts/${shiftboardId}` : null,
    fetcherGet
  );
  const { trigger } = useSWRMutation(
    `/api/volunteer-shifts/${shiftboardId}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // side effects
  // --------------------
  useEffect(() => {
    // listen for socket events
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on(
          "res-check-in-toggle",
          ({
            checked,
            shiftTimesId,
          }: {
            checked: boolean;
            shiftTimesId: number;
          }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const volunteerShiftItemFound = dataMutate.find(
                (volunteerShiftItem: IResVolunteerShiftItem) =>
                  volunteerShiftItem.shiftTimesId === shiftTimesId
              );
              if (volunteerShiftItemFound) {
                volunteerShiftItemFound.noShow = checked ? "" : "Yes";
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on("res-shift-volunteer-remove", ({ shiftTimesId }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            const volunteerShiftListNew = dataMutate.filter(
              (volunteerShiftItem: IResVolunteerShiftItem) =>
                volunteerShiftItem.shiftTimesId !== shiftTimesId
            );
            dataMutate.volunteerShiftList = volunteerShiftListNew;

            mutate(dataMutate);
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
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);

  // logic
  // --------------------
  if (error)
    return (
      <>
        <Typography component="h2" sx={{ mb: 1 }} variant="h4">
          Shifts
        </Typography>
        <ErrorAlert />
      </>
    );
  if (!data)
    return (
      <>
        <Typography component="h2" sx={{ mb: 1 }} variant="h4">
          Shifts
        </Typography>
        <Loading />
      </>
    );

  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const isCoreCrew = checkIsCoreCrew(accountType, roleList);

  // handle check in toggle
  const handleCheckInToggle = async ({
    checked,
    playaName,
    positionName,
    shiftboardId,
    shiftPositionId,
    shiftTimesId,
    worldName,
  }: ISwitchValues) => {
    try {
      await trigger({
        body: {
          checked,
          shiftboardId,
          shiftPositionId,
          shiftTimesId,
        },
        method: "PATCH",
      });
      socket.emit("req-check-in-toggle", {
        checked,
        shiftboardId,
        shiftPositionId,
        shiftTimesId,
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

  // prepare datatable
  const colorMapDisplay = getColorMap(data);
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
      name: "Check in",
      options: {
        filter: false,
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
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
  const dataTable = data.map(
    ({
      category,
      date,
      dateName,
      endTime,
      noShow,
      positionName,
      shiftPositionId,
      shiftTimesId,
      startTime,
    }: IResVolunteerShiftItem) => {
      // evaluate the check-in type and available features
      const checkInType = getCheckInType({
        dateTime: dayjs(dateTimeValue),
        endTime: dayjs(endTime),
        startTime: dayjs(startTime),
      });
      let isVolunteerRemoveAvailable = false;
      let isCheckInAvailable = false;

      switch (checkInType) {
        case SHIFT_FUTURE:
          isVolunteerRemoveAvailable = true;
          isCheckInAvailable = false;
          break;
        case SHIFT_DURING: {
          isVolunteerRemoveAvailable = true;
          isCheckInAvailable = true;
          break;
        }
        case SHIFT_PAST: {
          isVolunteerRemoveAvailable = isAuthenticated && isCoreCrew;
          isCheckInAvailable = isAuthenticated && isCoreCrew;
          break;
        }
        default: {
          throw new Error(`Unknown check-in type: ${checkInType}`);
        }
      }

      return [
        formatDateName(date, dateName),
        formatTime(startTime, endTime),
        positionName,
        <Chip
          key={`${shiftTimesId}${shiftPositionId}-chip`}
          label={positionName}
          sx={{ backgroundColor: colorMapDisplay[category] }}
        />,
        <Switch
          checked={noShow === ""}
          disabled={!isCheckInAvailable}
          onChange={(event) =>
            handleCheckInToggle({
              checked: event.target.checked,
              playaName,
              positionName,
              shiftboardId: Number(shiftboardId),
              shiftPositionId,
              shiftTimesId,
              worldName,
            })
          }
          key={`${shiftboardId}-switch`}
        />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${shiftboardId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/shifts/shift-volunteers/${shiftTimesId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <Groups3Icon />
                  </ListItemIcon>
                  <ListItemText>View volunteers</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem
                disabled={!isVolunteerRemoveAvailable}
                onClick={() =>
                  setIsDialogRemoveOpen({
                    isOpen: true,
                    shift: {
                      date,
                      dateName,
                      endTime,
                      positionName,
                      shiftPositionId,
                      shiftTimesId,
                      startTime,
                    },
                  })
                }
              >
                <ListItemIcon>
                  <EventBusyIcon />
                </ListItemIcon>
                <ListItemText>Remove</ListItemText>
              </MenuItem>
            </MenuList>
          }
        />,
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
  };

  // display
  // --------------------
  return (
    <>
      <Stack
        alignItems="flex-end"
        direction="row"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography component="h2" variant="h4">
          Shifts
        </Typography>
        <Button
          onClick={() => {
            router.push("/shifts");
          }}
          startIcon={<EventAvailableIcon />}
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

      {/* remove dialog */}
      <VolunteerShiftsDialogRemove
        handleDialogRemoveClose={() =>
          setIsDialogRemoveOpen({
            isOpen: false,
            shift: {
              date: "",
              dateName: "",
              endTime: "",
              positionName: "",
              shiftPositionId: 0,
              shiftTimesId: 0,
              startTime: "",
            },
          })
        }
        isDialogRemoveOpen={isDialogRemoveOpen.isOpen}
        shift={isDialogRemoveOpen.shift}
        shiftboardId={shiftboardId}
      />
    </>
  );
};
