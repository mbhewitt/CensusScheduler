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
    positionName: string;
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
    positionName,
    shiftboardId,
    shiftPositionId,
    shiftTimesId,
    worldName,
  },
}: IShiftVolunteersDialogRemoveProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/shift-volunteers/${shiftTimesId}`,
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
          for <strong>{positionName}</strong> has been removed
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

  // display
  // --------------------
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
          for <strong>{positionName}</strong>?
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
            isMutating ? <CircularProgress size="1rem" /> : <PersonRemoveIcon />
          }
          type="submit"
          variant="contained"
        >
          Remove volunteer
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
