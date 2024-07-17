import {
  Close as CloseIcon,
  UpdateDisabled as UpdateDisabledIcon,
} from "@mui/icons-material";
import {
  Button,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { UseFieldArrayRemove } from "react-hook-form";
import useSWR from "swr";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type { IResShiftTypeTimePositionItem } from "src/components/types/shifts/types";
import { fetcherGet } from "src/utils/fetcher";

interface ITimeItem {
  id: number;
  index: number;
  name: string;
}
interface IPositionItem {
  id: number;
  name: string;
}
interface IShiftTypesTimeRemoveProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  timeItem: ITimeItem;
  timeRemove: UseFieldArrayRemove;
  typeId: number;
}

export const ShiftTypesTimeRemove = ({
  handleDialogClose,
  isDialogOpen,
  timeItem,
  timeRemove,
  typeId,
}: IShiftTypesTimeRemoveProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResShiftTypeTimePositionItem[];
    error: Error | undefined;
  } = useSWR(
    timeItem.id
      ? `/api/shifts/types/${typeId}/times/${timeItem.id}/positions`
      : null,
    fetcherGet
  );

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
        text="Remove time"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Remove role"
      >
        <Loading />
      </DialogContainer>
    );

  const handleTimeRemove = async () => {
    timeRemove(timeItem.index);
    enqueueSnackbar(
      <SnackbarText>
        Click on the <strong>Update type</strong> button to finalize your
        changes
      </SnackbarText>,
      {
        variant: "warning",
      }
    );
    handleDialogClose();
  };

  // render
  // --------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
      text="Remove time"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              To remove{" "}
              <Link href={`/shifts/volunteers/${timeItem.id}`}>
                <strong>{timeItem.name}</strong>
              </Link>
              , volunteers must be removed from this time in the following
              positions:
            </Typography>
          </DialogContentText>
          <List sx={{ display: "inline-block", pl: 2, listStyleType: "disc" }}>
            {data.map((positionItem: IPositionItem) => {
              return (
                <ListItem
                  disablePadding
                  key={positionItem.id}
                  sx={{ display: "list-item", pl: 0 }}
                >
                  <ListItemText>{positionItem.name}</ListItemText>
                </ListItem>
              );
            })}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to remove <strong>{timeItem.name}</strong>{" "}
            time?
          </Typography>
        </DialogContentText>
      )}
      <DialogActions>
        <Button
          startIcon={<CloseIcon />}
          onClick={handleDialogClose}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disabled={data && data.length > 0}
          onClick={handleTimeRemove}
          startIcon={<UpdateDisabledIcon />}
          type="submit"
          variant="contained"
        >
          Remove time
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
