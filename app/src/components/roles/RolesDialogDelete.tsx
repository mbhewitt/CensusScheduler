import { Close as CloseIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Button,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { IRoleItem, IRoleVolunteerItem } from "src/components/types";
import { fetcherGet } from "src/utils/fetcher";

interface IRolesDialogDeleteProps {
  handleDialogDeleteClose: () => void;
  isDialogDeleteOpen: boolean;
  role: IRoleItem;
}

export const RolesDialogDelete = ({
  handleDialogDeleteClose,
  isDialogDeleteOpen,
  role: { roleId, roleName },
}: IRolesDialogDeleteProps) => {
  const { data, error } = useSWR(`/api/role-account/${roleId}`, fetcherGet);
  const { mutate } = useSWRConfig();
  const { enqueueSnackbar } = useSnackbar();

  // handle role delete
  const handleRoleDelete = async () => {
    try {
      await axios.delete(`/api/roles/${roleId}`);
      mutate("/api/roles");

      handleDialogDeleteClose();
      enqueueSnackbar(
        <SnackbarText>
          <strong>{roleName}</strong> role has been deleted
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

  if (error)
    return (
      <DialogContainer
        handleDialogClose={handleDialogDeleteClose}
        isDialogOpen={isDialogDeleteOpen}
        text="Delete role"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogDeleteClose}
        isDialogOpen={isDialogDeleteOpen}
        text="Delete role"
      >
        <Loading />
      </DialogContainer>
    );

  return (
    <DialogContainer
      handleDialogClose={handleDialogDeleteClose}
      isDialogOpen={isDialogDeleteOpen}
      text="Delete role"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              Before doing so, the <strong>{roleName}</strong> role must be
              removed from the following volunteers:
            </Typography>
          </DialogContentText>
          <List sx={{ pl: 2, listStyleType: "disc" }}>
            {data.map(
              ({ playaName, shiftboardId, worldName }: IRoleVolunteerItem) => {
                return (
                  <ListItem
                    disablePadding
                    key={shiftboardId}
                    sx={{ display: "list-item", pl: 0 }}
                  >
                    <ListItemText primary={`${playaName} "${worldName}"`} />
                  </ListItem>
                );
              }
            )}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete <strong>{roleName}</strong> role?
          </Typography>
        </DialogContentText>
      )}
      <DialogActions>
        <Button
          startIcon={<CloseIcon />}
          onClick={handleDialogDeleteClose}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disabled={data && data.length > 0}
          onClick={handleRoleDelete}
          startIcon={<DeleteIcon />}
          type="submit"
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
