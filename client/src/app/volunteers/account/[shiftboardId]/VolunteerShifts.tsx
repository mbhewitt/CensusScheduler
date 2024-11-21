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
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useSWR, { KeyedMutator } from "swr";
import useSWRMutation from "swr/mutation";

import { VolunteerShiftsDialogRemove } from "@/app/volunteers/account/[shiftboardId]/VolunteerShiftsDialogRemove";
import { DataTable } from "@/components/general/DataTable";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Loading } from "@/components/general/Loading";
import { MoreMenu } from "@/components/general/MoreMenu";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IReqSwitchValues, ISwitchValues } from "@/components/types";
import type { IResVolunteerShiftItem } from "@/components/types/volunteers";
import { SHIFT_DURING, SHIFT_FUTURE, SHIFT_PAST } from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin, checkIsAuthenticated } from "@/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";
import { getCheckInType } from "@/utils/getCheckInType";
import { getColorMap } from "@/utils/getColorMap";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "@/utils/setCellPropsCenter";

enum DialogList {
  Remove,
}
interface IVolunteerShiftsProps {
  shiftboardId: string;
}

const socket = io();
export const VolunteerShifts = ({ shiftboardId }: IVolunteerShiftsProps) => {
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
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    shift: {
      dateName: "",
      endTime: "",
      position: { name: "" },
      shiftPositionId: 0,
      timeId: 0,
      startTime: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const {
    data,
    error,
    mutate,
  }: {
    data: IResVolunteerShiftItem[];
    error: Error | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutate: KeyedMutator<any>;
  } = useSWR(`/api/volunteers/shifts/${shiftboardId}`, fetcherGet);
  const { trigger } = useSWRMutation(
    `/api/volunteers/shifts/${shiftboardId}`,
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
          ({ checked, timeId }: { checked: boolean; timeId: number }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const volunteerShiftItemFound = dataMutate.find(
                (volunteerShiftItem: IResVolunteerShiftItem) =>
                  volunteerShiftItem.timeId === timeId
              );
              if (volunteerShiftItemFound) {
                volunteerShiftItemFound.noShow = checked ? "" : "Yes";
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on("res-shift-volunteer-remove", ({ timeId }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            const volunteerShiftListNew = dataMutate.filter(
              (volunteerShiftItem: IResVolunteerShiftItem) =>
                volunteerShiftItem.timeId !== timeId
            );

            mutate(volunteerShiftListNew);
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
      const body: IReqSwitchValues = {
        isCheckedIn,
        shiftboardId,
        shiftPositionId,
        timeId,
      };

      // update database
      await trigger({
        body,
        method: "PATCH",
      });
      socket.emit("req-check-in-toggle", body);

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

  // prepare datatable
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
  const colorMapDisplay = getColorMap(data);
  const dataTable = data.map(
    ({
      dateName,
      department: { name: departmentName },
      endTime,
      noShow,
      position: { name: positionName },
      shiftPositionId,
      startTime,
      timeId,
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
          isVolunteerRemoveAvailable = isAuthenticated && isAdmin;
          isCheckInAvailable = isAuthenticated && isAdmin;
          break;
        }
        default: {
          throw new Error(`Unknown check-in type: ${checkInType}`);
        }
      }

      return [
        formatDateName(startTime, dateName),
        formatTime(startTime, endTime),
        positionName,
        <Chip
          key={`${timeId}${shiftPositionId}-chip`}
          label={positionName}
          sx={{ backgroundColor: colorMapDisplay[departmentName] }}
        />,
        <Switch
          checked={noShow === ""}
          disabled={!isCheckInAvailable}
          onChange={(event) =>
            handleCheckInToggle({
              isCheckedIn: event.target.checked,
              playaName,
              position: {
                name: positionName,
              },
              shiftboardId: Number(shiftboardId),
              shiftPositionId,
              timeId,
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
              <Link href={`/shifts/volunteers/${timeId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <Groups3Icon />
                  </ListItemIcon>
                  <ListItemText>View volunteers</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem
                disabled={!isVolunteerRemoveAvailable}
                onClick={() => {
                  setDialogCurrent({
                    dialogItem: DialogList.Remove,
                    shift: {
                      dateName,
                      endTime,
                      position: { name: positionName },
                      shiftPositionId,
                      startTime,
                      timeId,
                    },
                  });
                  setIsDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <EventBusyIcon />
                </ListItemIcon>
                <ListItemText>Remove shift</ListItemText>
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

  // render
  // --------------------
  return (
    <>
      <Stack
        alignItems="flex-end"
        direction="row"
        justifyContent="space-between"
        sx={{ mb: 2 }}
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
          Add shift
        </Button>
      </Stack>
      <DataTable
        columnList={columnList}
        dataTable={dataTable}
        optionListCustom={optionListCustom}
      />

      {/* remove dialog */}
      <VolunteerShiftsDialogRemove
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Remove && isDialogOpen
        }
        shiftItem={dialogCurrent.shift}
        shiftboardId={shiftboardId}
      />
    </>
  );
};
