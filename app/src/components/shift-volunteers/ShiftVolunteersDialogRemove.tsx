import {
  Close as CloseIcon,
  PersonRemove as PersonRemoveIcon,
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

interface IShiftVolunteersDialogRemoveProps {
  handleDialogRemoveClose: () => void;
  isDialogRemoveOpen: boolean;
  volunteer: {
    playaName: string;
    position: string;
    shiftboardId: number;
    shiftPositionId: number;
    shiftTimesId: number;
    worldName: string;
  };
}

const socket = io();
export const ShiftVolunteersDialogRemove = ({
  handleDialogRemoveClose,
  isDialogRemoveOpen,
  volunteer: {
    playaName,
    position,
    shiftboardId,
    shiftPositionId,
    shiftTimesId,
    worldName,
  },
}: IShiftVolunteersDialogRemoveProps) => {
  const { isMutating, trigger } = useSWRMutation(
    `/api/shift-account/${shiftTimesId}`,
    fetcherTrigger
  );
  const { enqueueSnackbar } = useSnackbar();

  const handleVolunteerRemove = async () => {
    try {
      await trigger({
        body: { shiftboardId, shiftPositionId, shiftTimesId },
        method: "DELETE",
      });
      socket.emit("req-shift-volunteer-remove", {
        shiftboardId,
        shiftPositionId,
        shiftTimesId,
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
    <DialogContainer
      handleDialogClose={handleDialogRemoveClose}
      isDialogOpen={isDialogRemoveOpen}
      text="Remove volunteer"
    >
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
          startIcon={<CloseIcon />}
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
            isMutating ? <CircularProgress size="1rem" /> : <PersonRemoveIcon />
          }
          type="submit"
          variant="contained"
        >
          Remove
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
