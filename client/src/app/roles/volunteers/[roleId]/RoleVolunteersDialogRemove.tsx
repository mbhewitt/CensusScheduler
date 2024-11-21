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
import { useContext } from "react";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import type {
  IReqRoleVolunteerItem,
  IResRoleRowItem,
  IResRoleVolunteerItem,
} from "@/components/types/roles";
import { SESSION_ROLE_ITEM_REMOVE } from "@/constants";
import { SessionContext } from "@/state/session/context";
import { fetcherTrigger } from "@/utils/fetcher";

interface IRoleVolunteersDialogRemoveProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  roleItem: IResRoleRowItem;
  volunteerItem: IResRoleVolunteerItem;
}

export const RoleVolunteersDialogRemove = ({
  handleDialogClose,
  isDialogOpen,
  roleItem: { id: roleId, name: roleName },
  volunteerItem: { playaName, shiftboardId: shiftboardIdSelected, worldName },
}: IRoleVolunteersDialogRemoveProps) => {
  // context
  // --------------------
  const {
    sessionDispatch,
    sessionState: {
      user: { shiftboardId: shiftboardIdAuthenticated },
    },
  } = useContext(SessionContext);

  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/roles/volunteers/${roleId}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // --------------------
  const handleRoleVolunteerRemove = async () => {
    try {
      const body: IReqRoleVolunteerItem = {
        shiftboardId: shiftboardIdSelected,
      };

      // update database
      await trigger({
        body,
        method: "DELETE",
      });
      // if the selected volunteer is the same as the authenticated volunteer
      // then update state
      if (shiftboardIdSelected === shiftboardIdAuthenticated) {
        sessionDispatch({
          payload: {
            id: roleId,
            name: roleName,
          },
          type: SESSION_ROLE_ITEM_REMOVE,
        });
      }

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
          startIcon={<CloseIcon />}
          onClick={handleDialogClose}
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
          Remove volunteer
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
