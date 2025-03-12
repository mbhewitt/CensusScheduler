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
import { io } from "socket.io-client";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import { fetcherTrigger } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";

interface IVolunteerShiftsDialogRemoveProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shiftItem: {
    dateName: string;
    endTime: string;
    position: { name: string };
    startTime: string;
    timePositionId: number;
  };
  shiftboardId: string | string[] | undefined;
}

const socket = io();
export const VolunteerShiftsDialogRemove = ({
  handleDialogClose,
  isDialogOpen,
  shiftItem: {
    dateName,
    endTime,
    position: { name: positionName },
    startTime,
    timePositionId,
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
      // update database
      await trigger({
        body: { shiftboardId, timePositionId },
        method: "DELETE",
      });
      // emit event
      socket.emit("req-shift-volunteer-remove", {
        shiftboardId,
        timePositionId,
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formatDateName(startTime, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> for{" "}
          <strong>{positionName}</strong> has been removed
        </SnackbarText>,
        {
          variant: "success",
        }
      );
      handleDialogClose();
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
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
      text="Remove volunteer shift"
    >
      <DialogContentText>
        <Typography component="span">
          Are you sure you want to remove{" "}
          <strong>{formatDateName(startTime, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> for{" "}
          <strong>{positionName}</strong>?
        </Typography>
      </DialogContentText>
      <DialogActions>
        <Button
          disabled={isMutating}
          startIcon={<CloseIcon />}
          onClick={handleDialogClose}
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
