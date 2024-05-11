import {
  Close as CloseIcon,
  PlaylistRemove as PlaylistRemoveIcon,
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
import type { IResShiftCategoryItem } from "src/components/types";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IShiftCategoriesDialogDeleteProps {
  categoryItem: IResShiftCategoryItem;
  handleDialogClose: () => void;
  isDialogOpen: boolean;
}

export const ShiftCategoriesDialogDelete = ({
  categoryItem: { id, name },
  handleDialogClose,
  isDialogOpen,
}: IShiftCategoriesDialogDeleteProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR(`/api/shifts/categories/${id}`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/categories/${id}`,
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
        text="Delete category"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Delete category"
      >
        <Loading />
      </DialogContainer>
    );

  const handleShiftCategoryDelete = async () => {
    // update database
    try {
      await trigger({
        method: "DELETE",
      });
      mutate("/api/shifts/categories");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> category has been deleted
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
      text="Delete category"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              Before removing <strong>{name}</strong>, the following types must
              be deleted from this category:
            </Typography>
          </DialogContentText>
          <List sx={{ display: "inline-block", pl: 2, listStyleType: "disc" }}>
            {data.map((typeItem: IPositionItem) => {
              return (
                <ListItem
                  disablePadding
                  key={typeItem.id}
                  sx={{ display: "list-item", pl: 0 }}
                >
                  <ListItemText>{typeItem.name}</ListItemText>
                </ListItem>
              );
            })}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete <strong>{name}</strong> category?
          </Typography>
        </DialogContentText>
      )}
      <DialogActions>
        <Button
          disabled={isMutating}
          startIcon={
            isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
          }
          onClick={handleDialogClose}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disabled={isMutating}
          onClick={handleShiftCategoryDelete}
          startIcon={
            isMutating ? (
              <CircularProgress size="1rem" />
            ) : (
              <PlaylistRemoveIcon />
            )
          }
          type="submit"
          variant="contained"
        >
          Delete category
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
