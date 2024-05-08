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
import { fetcherGet } from "src/utils/fetcher";

interface ITimeItem {
  dateTime: string;
  id: number;
  index: number;
}
interface IPositionItem {
  id: number;
  name: string;
}
interface ITypeItem {
  id: number;
}
interface IShiftTypeTimeRemoveProps {
  handleTimeDialogRemoveClose: () => void;
  isTimeDialogRemoveOpen: boolean;
  timeItem: ITimeItem;
  timeRemove: UseFieldArrayRemove;
  typeItem: ITypeItem;
}

export const ShiftTypeTimeRemove = ({
  handleTimeDialogRemoveClose,
  isTimeDialogRemoveOpen,
  timeItem,
  timeRemove,
  typeItem,
}: IShiftTypeTimeRemoveProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR(
    `/api/shifts/types/${typeItem.id}/times/${timeItem.id}`,
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
        handleDialogClose={handleTimeDialogRemoveClose}
        isDialogOpen={isTimeDialogRemoveOpen}
        text="Remove time"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleTimeDialogRemoveClose}
        isDialogOpen={isTimeDialogRemoveOpen}
        text="Remove role"
      >
        <Loading />
      </DialogContainer>
    );

  const handleTimeRemove = async () => {
    timeRemove(timeItem.index);
    handleTimeDialogRemoveClose();
    enqueueSnackbar(
      <SnackbarText>
        Click on the <strong>Update type</strong> button to finalize your
        changes
      </SnackbarText>,
      {
        variant: "warning",
      }
    );
  };

  // render
  // --------------------
  return (
    <DialogContainer
      handleDialogClose={handleTimeDialogRemoveClose}
      isDialogOpen={isTimeDialogRemoveOpen}
      text="Remove time"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              Before doing so,{" "}
              <Link href={`/shifts/volunteers/${timeItem.id}`}>
                <strong>{timeItem.dateTime}</strong>
              </Link>{" "}
              shift volunteers must be removed from the time in the following
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
            Are you sure you want to remove <strong>{timeItem.dateTime}</strong>{" "}
            time?
          </Typography>
        </DialogContentText>
      )}
      <DialogActions>
        <Button
          startIcon={<CloseIcon />}
          onClick={handleTimeDialogRemoveClose}
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