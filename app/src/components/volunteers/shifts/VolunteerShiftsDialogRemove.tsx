import {
  Close as CloseIcon,
  EventBusy as EventBusyIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContentText,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import io from "socket.io-client";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";
import { fetcherTrigger } from "src/utils/fetcher";
import { formatDateName, formatTime } from "src/utils/formatDateTime";

interface IVolunteerShiftsDialogRemoveProps {
  handleDialogRemoveClose: () => void;
  isDialogRemoveOpen: boolean;
  shift: {
    date: string;
    dateName: string;
    endTime: string;
    positionName: string;
    shiftPositionId: number;
    startTime: string;
    timeId: number;
  };
  shiftboardId: string | string[] | undefined;
}

const socket = io();
export const VolunteerShiftsDialogRemove = ({
  handleDialogRemoveClose,
  isDialogRemoveOpen,
  shift: {
    date,
    dateName,
    endTime,
    positionName,
    shiftPositionId,
    startTime,
    timeId,
  },
  shiftboardId,
}: IVolunteerShiftsDialogRemoveProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteers/shifts/${shiftboardId}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // --------------------
  const handleVolunteerRemove = async () => {
    try {
      await trigger({
        body: { shiftPositionId, timeId, shiftboardId },
        method: "DELETE",
      });
      socket.emit("req-shift-volunteer-remove", {
        shiftboardId,
        timeId,
      });

      handleDialogRemoveClose();
      enqueueSnackbar(
        <SnackbarText>
          <strong>{formatDateName(date, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> for{" "}
          <strong>{positionName}</strong> has been removed
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

  // render
  // --------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogRemoveClose}
      isDialogOpen={isDialogRemoveOpen}
      text="Remove volunteer shift"
    >
      <DialogContentText>
        <Typography component="span">
          Are you sure you want to remove{" "}
          <strong>{formatDateName(date, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> for{" "}
          <strong>{positionName}</strong>?
        </Typography>
      </DialogContentText>
      <DialogActions>
        <Button
          disabled={isMutating}
          startIcon={
            isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
          }
          onClick={handleDialogRemoveClose}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disabled={isMutating}
          onClick={handleVolunteerRemove}
          startIcon={
            isMutating ? <CircularProgress size="1rem" /> : <EventBusyIcon />
          }
          type="submit"
          variant="contained"
        >
          Remove shift
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
