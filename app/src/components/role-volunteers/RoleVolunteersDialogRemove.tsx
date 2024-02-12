import {
  HighlightOff as HighlightOffIcon,
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

interface IRoleVolunteersDialogRemoveProps {
  handleDialogRemoveClose: () => void;
  isDialogRemoveOpen: boolean;
  volunteer: {
    playaName: string;
    roleName: string;
    shiftboardId: number;
    worldName: string;
  };
}

const socket = io();
export const RoleVolunteersDialogRemove = ({
  handleDialogRemoveClose,
  isDialogRemoveOpen,
  volunteer: { playaName, roleName, shiftboardId, worldName },
}: IRoleVolunteersDialogRemoveProps) => {
  const { isMutating, trigger } = useSWRMutation(
    `/api/roles/${roleName}`,
    fetcherTrigger
  );
  const { enqueueSnackbar } = useSnackbar();

  // handle role volunteer remove
  const handleRoleVolunteerRemove = async () => {
    try {
      await trigger({
        body: {
          shiftboardId,
        },
        method: "DELETE",
      });
      socket.emit("req-role-volunteer-remove", {
        shiftboardId,
      });

      handleDialogRemoveClose();
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          for <strong>{roleName}</strong> role has been removed
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
      text="Remove role volunteer"
    >
      <DialogContentText>
        <Typography component="span">
          Are you sure you want to remove{" "}
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          for <strong>{roleName}</strong> role?
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
          onClick={handleRoleVolunteerRemove}
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
