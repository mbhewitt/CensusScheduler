import {
  Close as CloseIcon,
  GroupRemove as GroupRemoveIcon,
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

import { DialogContainer } from "@/components/general/DialogContainer";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import type {
  IResShiftPositionRowItem,
  IResShiftPositionTypeItem,
} from "@/components/types/shifts/positions";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

interface IShiftPositionsDialogDeleteProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  positionItem: IResShiftPositionRowItem;
}

export const ShiftPositionsDialogDelete = ({
  handleDialogClose,
  isDialogOpen,
  positionItem: { id: positionId, name: positionName },
}: IShiftPositionsDialogDeleteProps) => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IResShiftPositionTypeItem[];
    error: Error | undefined;
  } = useSWR(`/api/shifts/positions/${positionId}/types`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/positions/${positionId}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // ------------------------------------------------------------
  if (error)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Delete position"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Delete position"
      >
        <Loading />
      </DialogContainer>
    );

  const handleShiftPositionDelete = async () => {
    try {
      // update database
      await trigger({
        method: "DELETE",
      });
      mutate("/api/shifts/positions");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{positionName}</strong> type has been deleted
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
      text="Delete position"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              To delete <strong>{positionName}</strong>, this position must be
              removed from the following types:
            </Typography>
          </DialogContentText>
          <List sx={{ display: "inline-block", pl: 2, listStyleType: "disc" }}>
            {data.map(({ id: typeId, name: typeName }) => {
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
            })}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete <strong>{positionName}</strong>{" "}
            position?
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
          disabled={(data && data.length > 0) || isMutating}
          onClick={handleShiftPositionDelete}
          startIcon={
            isMutating ? <CircularProgress size="1rem" /> : <GroupRemoveIcon />
          }
          type="submit"
          variant="contained"
        >
          Delete position
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
