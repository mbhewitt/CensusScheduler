import {
  Close as CloseIcon,
  RemoveModerator as RemoveModeratorIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IResRoleListItem,
  IResRoleVolunteerItem,
} from "src/components/types/roles";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IRolesDialogDeleteProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  roleItem: IResRoleListItem;
}

export const RolesDialogDelete = ({
  handleDialogClose,
  isDialogOpen,
  roleItem: { id, name },
}: IRolesDialogDeleteProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResRoleVolunteerItem[];
    error: Error | undefined;
  } = useSWR(`/api/roles/volunteers/${id}`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/roles/${id}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // --------------------
  if (error)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Delete role"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Delete role"
      >
        <Loading />
      </DialogContainer>
    );

  const handleRoleDelete = async () => {
    try {
      // update database
      await trigger({
        method: "DELETE",
      });
      mutate("/api/roles");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> role has been deleted
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
      text="Delete role"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              To delete <strong>{name}</strong>, this role must be removed from
              the following volunteers:
            </Typography>
          </DialogContentText>
          <List sx={{ pl: 2, listStyleType: "disc" }}>
            {data.map(({ playaName, shiftboardId, worldName }) => {
              return (
                <ListItem
                  disablePadding
                  key={shiftboardId}
                  sx={{ display: "list-item", pl: 0 }}
                >
                  <ListItemText primary={`${playaName} "${worldName}"`} />
                </ListItem>
              );
            })}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete <strong>{name}</strong> role?
          </Typography>
        </DialogContentText>
      )}
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
          disabled={isMutating || (data && data.length > 0)}
          onClick={handleRoleDelete}
          startIcon={
            isMutating ? (
              <CircularProgress size="1rem" />
            ) : (
              <RemoveModeratorIcon />
            )
          }
          type="submit"
          variant="contained"
        >
          Delete role
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
