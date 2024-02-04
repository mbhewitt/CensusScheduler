import {
  Delete as DeleteIcon,
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

interface IRolesDialogDeleteProps {
  handleDialogDeleteClose: () => void;
  isDialogDeleteOpen: boolean;
  role: {
    name: string;
  };
}

const socket = io();
export const RolesDialogDelete = ({
  handleDialogDeleteClose,
  isDialogDeleteOpen,
  role: { name },
}: IRolesDialogDeleteProps) => {
  const { isMutating, trigger } = useSWRMutation("/api/roles", fetcherTrigger);
  const { enqueueSnackbar } = useSnackbar();

  // handle role delete
  const handleRoleDelete = async () => {
    try {
      await trigger({
        body: {
          name,
        },
        method: "DELETE",
      });
      socket.emit("req-role-delete", {
        name,
      });

      handleDialogDeleteClose();
      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> role has been deleted
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
      onClose={handleDialogDeleteClose}
      open={isDialogDeleteOpen}
    >
      <DialogHeader
        handleDialogClose={handleDialogDeleteClose}
        text="Delete role"
      />
      <DialogContent>
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete <strong>{name}</strong> role?
          </Typography>
        </DialogContentText>
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={<HighlightOffIcon />}
            onClick={handleDialogDeleteClose}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isMutating}
            onClick={handleRoleDelete}
            startIcon={
              isMutating ? <CircularProgress size="sm" /> : <DeleteIcon />
            }
            type="submit"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};
