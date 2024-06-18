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
import Link from "next/link";
import { useSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IResShiftCategoryItem,
  IResShiftCategoryTypeItem,
} from "src/components/types/shifts/categories";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IShiftCategoriesDialogDeleteProps {
  categoryItem: IResShiftCategoryItem;
  handleDialogClose: () => void;
  isDialogOpen: boolean;
}

export const ShiftCategoriesDialogDelete = ({
  categoryItem: { id: categoryId, name: categoryName },
  handleDialogClose,
  isDialogOpen,
}: IShiftCategoriesDialogDeleteProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResShiftCategoryTypeItem[];
    error: Error | undefined;
  } = useSWR(`/api/shifts/categories/${categoryId}/types`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/categories/${categoryId}`,
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
    try {
      // update database
      await trigger({
        method: "DELETE",
      });
      mutate("/api/shifts/categories");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{categoryName}</strong> category has been deleted
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
              To delete <strong>{categoryName}</strong>, this category must be
              removed from the following types:
            </Typography>
          </DialogContentText>
          <List sx={{ display: "inline-block", pl: 2, listStyleType: "disc" }}>
            {data.map(
              ({
                id: typeId,
                name: typeName,
              }: {
                id: number;
                name: string;
              }) => {
                return (
                  <ListItem
                    disablePadding
                    key={typeId}
                    sx={{ display: "list-item", pl: 0 }}
                  >
                    <Link href={`/shifts/types/update/${typeId}`}>
                      <ListItemText>{typeName}</ListItemText>
                    </Link>
                  </ListItem>
                );
              }
            )}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete <strong>{categoryName}</strong>{" "}
            category?
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
