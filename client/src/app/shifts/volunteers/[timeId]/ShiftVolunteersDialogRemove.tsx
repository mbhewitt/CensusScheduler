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
import { io } from "socket.io-client";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import { REMOVE_SHIFT_VOLUNTEER_REQ } from "@/constants";
import { fetcherTrigger } from "@/utils/fetcher";

interface IShiftVolunteersDialogRemoveProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shift: {
    positionName: string;
    timeId: number;
    timePositionId: number;
  };
  volunteer: {
    playaName: string;
    shiftboardId: number;
    worldName: string;
  };
}

const socket = io();
export const ShiftVolunteersDialogRemove = ({
  handleDialogClose,
  isDialogOpen,
  shift: { positionName, timeId, timePositionId },
  volunteer: { playaName, shiftboardId, worldName },
}: IShiftVolunteersDialogRemoveProps) => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/volunteers/${timeId}`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // ------------------------------------------------------------
  const handleVolunteerRemove = async () => {
    try {
      // update database
      await trigger({
        body: { shiftboardId, timePositionId, timeId },
        method: "DELETE",
      });
      // emit event
      socket.emit(REMOVE_SHIFT_VOLUNTEER_REQ, {
        shiftboardId,
        timePositionId,
      });

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
  // ------------------------------------------------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
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
