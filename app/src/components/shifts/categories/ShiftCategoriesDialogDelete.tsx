import {
  Close as CloseIcon,
  PlaylistRemove as PlaylistRemoveIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContentText,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";
import type { IResShiftCategoryItem } from "src/components/types";
import { fetcherTrigger } from "src/utils/fetcher";

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
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/categories/${id}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

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
      <DialogContentText>
        <Typography component="span">
          Are you sure you want to delete <strong>{name}</strong> category?
        </Typography>
      </DialogContentText>
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
