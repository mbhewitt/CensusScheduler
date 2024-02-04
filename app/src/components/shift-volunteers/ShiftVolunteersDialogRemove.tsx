import {
  HighlightOff as HighlightOffIcon,
  PersonRemove as PersonRemoveIcon,
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

interface IShiftVolunteersDialogRemoveProps {
  handleDialogRemoveClose: () => void;
  isDialogRemoveOpen: boolean;
  shiftId: string | string[] | undefined;
  volunteer: {
    playaName: string;
    position: string;
    shiftboardId: number;
    shiftPositionId: string;
    worldName: string;
  };
}

const socket = io();
export const ShiftVolunteersDialogRemove = ({
  handleDialogRemoveClose,
  isDialogRemoveOpen,
  shiftId,
  volunteer: { playaName, position, shiftboardId, shiftPositionId, worldName },
}: IShiftVolunteersDialogRemoveProps) => {
  const { isMutating, trigger } = useSWRMutation(
    `/api/shift-volunteers/${shiftId}`,
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
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          for <strong>{position}</strong> has been removed
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
        text="Remove volunteer"
      />
      <DialogContent>
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to remove{" "}
            <strong>
              {playaName} &quot;{worldName}&quot;
            </strong>{" "}
            for <strong>{position}</strong>?
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
              isMutating ? (
                <CircularProgress size="1rem" />
              ) : (
                <PersonRemoveIcon />
              )
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
