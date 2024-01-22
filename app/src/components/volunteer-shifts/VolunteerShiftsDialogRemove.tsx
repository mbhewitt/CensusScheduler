import {
  EventBusy as EventBusyIcon,
  HighlightOff as HighlightOffIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import io from "socket.io-client";
import useSWRMutation from "swr/mutation";

import { DialogHeader } from "src/components/general/DialogHeader";
import { SnackbarText } from "src/components/general/SnackbarText";
import { fetcherTrigger } from "src/utils/fetcher";

interface IVolunteerShiftsDialogRemoveProps {
  handleDialogRemoveClose: () => void;
  isDialogRemoveOpen: boolean;
  shift: {
    day: string;
    time: string;
    position: string;
    shiftPositionId: string;
  };
  shiftboardId: string | string[] | undefined;
}

const socket = io();
export const VolunteerShiftsDialogRemove = ({
  handleDialogRemoveClose,
  isDialogRemoveOpen,
  shift: { day, time, position, shiftPositionId },
  shiftboardId,
}: IVolunteerShiftsDialogRemoveProps) => {
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteer-shifts/${shiftboardId}`,
    fetcherTrigger
  );
  const { enqueueSnackbar } = useSnackbar();

  const handleVolunteerRemove = async () => {
    try {
      await trigger({
        body: { shiftboardId, shiftPositionId },
        method: "DELETE",
      });
      socket.emit("req-shift-volunteer-remove", {
        shiftboardId,
        shiftPositionId,
      });

      handleDialogRemoveClose();
      enqueueSnackbar(
        <SnackbarText>
          <strong>{day}</strong> at <strong>{time}</strong> for{" "}
          <strong>{position}</strong> has been removed
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

  return (
    <Dialog
      fullWidth
      onClose={handleDialogRemoveClose}
      open={isDialogRemoveOpen}
    >
      <DialogHeader
        handleDialogClose={handleDialogRemoveClose}
        text="Remove shift"
      />
      <DialogContent>
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to remove <strong>{day}</strong> at{" "}
            <strong>{time}</strong> for <strong>{position}</strong>?
          </Typography>
        </DialogContentText>
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={<HighlightOffIcon />}
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
              isMutating ? <CircularProgress size="sm" /> : <EventBusyIcon />
            }
            type="submit"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};
