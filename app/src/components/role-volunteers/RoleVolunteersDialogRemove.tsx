import {
  Close as CloseIcon,
  PersonRemove as PersonRemoveIcon,
} from "@mui/icons-material";
import {
  Button,
  DialogActions,
  DialogContentText,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";

interface IRoleVolunteersDialogRemoveProps {
  handleDialogRemoveClose: () => void;
  isDialogRemoveOpen: boolean;
  volunteer: {
    playaName: string;
    roleId: number;
    roleName: string;
    shiftboardId: number;
    worldName: string;
  };
}

export const RoleVolunteersDialogRemove = ({
  handleDialogRemoveClose,
  isDialogRemoveOpen,
  volunteer: { playaName, roleId, roleName, shiftboardId, worldName },
}: IRoleVolunteersDialogRemoveProps) => {
  const { mutate } = useSWRConfig();
  const { enqueueSnackbar } = useSnackbar();

  // handle role volunteer remove
  const handleRoleVolunteerRemove = async () => {
    try {
      // update database
      await axios.delete(`/api/role-account/${roleId}`, {
        data: shiftboardId,
      });
      mutate(`/api/role-account/${roleId}`);

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
          startIcon={<CloseIcon />}
          onClick={handleDialogRemoveClose}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleRoleVolunteerRemove}
          startIcon={<PersonRemoveIcon />}
          type="submit"
          variant="contained"
        >
          Remove
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
