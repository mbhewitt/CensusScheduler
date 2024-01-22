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
import {
  blue,
  green,
  orange,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";
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
import type { IDataVolunteerShiftItem } from "src/components/types";
import { VolunteerShiftsDialogAdd } from "src/components/volunteer-shifts/VolunteerShiftsDialogAdd";
import { VolunteerShiftsDialogRemove } from "src/components/volunteer-shifts/VolunteerShiftsDialogRemove";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";
import { checkInGet } from "src/utils/checkInGet";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface ISwitchValues {
  checked: boolean;
  position: string;
  shiftPositionId: string;
}

const socket = io();
export const VolunteerShifts = () => {
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
    shift: {
      day: "",
      time: "",
      position: "",
      shiftPositionId: "",
    },
  });
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
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on(
          "res-check-in",
          ({
            checked,
            shiftPositionId,
          }: {
            checked: boolean;
            shiftPositionId: string;
          }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const volunteerShiftItemUpdate =
                dataMutate.volunteerShiftList.find(
                  (volunteerShiftItem: IDataVolunteerShiftItem) =>
                    volunteerShiftItem.shiftPositionId === shiftPositionId
                );
              if (volunteerShiftItemUpdate) {
                volunteerShiftItemUpdate.noShow = checked ? "" : "Yes";
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on(
          "res-shift-volunteer-add",
          ({
            date,
            dateName,
            endTime,
            noShow,
            position,
            shit,
            shiftId,
            shiftPositionId,
            startTime,
          }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              dataMutate.volunteerShiftList.push({
                date,
                dateName,
                endTime,
                noShow,
                position,
                shit,
                shiftId,
                shiftPositionId,
                startTime,
              });

              mutate(dataMutate);
            }
          }
        );
        socket.on("res-shift-volunteer-remove", ({ shiftPositionId }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            const volunteerShiftListNew = dataMutate.volunteerShiftList.filter(
              (volunteerShiftItem: IDataVolunteerShiftItem) =>
                volunteerShiftItem.shiftPositionId !== shiftPositionId
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

  if (error)
    return (
      <>
        <Typography component="h2" sx={{ mb: 1 }} variant="h4">
          Shifts
        </Typography>
        <ErrorAlert />
      </>
    );
  if (!data) return <Loading />;

  const { playaName, worldName } = data;
  const handleOnChange = async ({
    checked,
    position,
    shiftPositionId,
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
      socket.emit("req-check-in", {
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

  // prepare datatable
  const colorList = [
    red[100],
    orange[100],
    yellow[100],
    green[100],
    teal[100],
    blue[100],
    purple[100],
  ];
  let colorIndexCurrent = 0;
  const colorMap = data.volunteerShiftList.reduce(
    (
      shiftListTotal: { [key: string]: string },
      { position }: { position: string }
    ) => {
      const shiftListTotalNew = structuredClone(shiftListTotal);

      if (!shiftListTotalNew[position]) {
        shiftListTotalNew[position] = colorList[colorIndexCurrent];
        colorIndexCurrent += 1;
      }

      return shiftListTotalNew;
    },
    {}
  );

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
      options: { filter: false, searchable: false, sort: false },
    },
    { name: "", options: { filter: false, searchable: false, sort: false } },
  ];
  const dataTable = data.volunteerShiftList.map(
    ({
      date,
      dateName,
      endTime,
      noShow,
      position,
      shift,
      shiftId,
      shiftPositionId,
      startTime,
    }: IDataVolunteerShiftItem) => {
      // evaluate the check-in type and available features
      const checkInType = checkInGet({
        dateTime: dateTimeValue,
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
        `${dateName} ${date}`,
        shift,
        position,
        <Chip
          key={`${position}-chip`}
          label={position}
          sx={{ backgroundColor: colorMap[position] }}
        />,
        <Switch
          checked={noShow === ""}
          disabled={!isCheckInAvailable}
          onChange={(event) =>
            handleOnChange({
              checked: event.target.checked,
              position,
              shiftPositionId,
            })
          }
          key={`${shiftboardId}-switch`}
        />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${shiftboardId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/shifts/shift-volunteers/${shiftId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <Groups3Icon />
                  </ListItemIcon>
                  <ListItemText>Shift volunteers</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem
                disabled={!isVolunteerRemoveAvailable}
                onClick={() =>
                  setIsDialogRemoveOpen({
                    isOpen: true,
                    shift: {
                      day: `${dateName} ${date}`,
                      time: shift,
                      position,
                      shiftPositionId,
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
          onClick={() => setIsDialogAddOpen(true)}
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

      {/* add dialog */}
      <VolunteerShiftsDialogAdd
        handleDialogAddClose={() => setIsDialogAddOpen(false)}
        isDialogAddOpen={isDialogAddOpen}
        playaName={playaName}
        shiftboardId={shiftboardId}
        worldName={worldName}
      />

      {/* remove dialog */}
      <VolunteerShiftsDialogRemove
        handleDialogRemoveClose={() =>
          setIsDialogRemoveOpen({
            isOpen: false,
            shift: {
              day: "",
              time: "",
              position: "",
              shiftPositionId: "",
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
