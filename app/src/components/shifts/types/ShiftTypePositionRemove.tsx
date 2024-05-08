import {
  Close as CloseIcon,
  PersonRemove as PersonRemoveIcon,
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
import { useSnackbar } from "notistack";
import { UseFieldArrayRemove } from "react-hook-form";
import useSWR from "swr";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { fetcherGet } from "src/utils/fetcher";

interface IPositionItem {
  id: number;
  index: number;
  name: string;
}
interface ITimeItem {
  id: number;
  time: string;
}
interface ITypeItem {
  id: number;
}
interface IShiftTypePositionRemoveProps {
  handleDialogRemoveClose: () => void;
  isDialogRemoveOpen: boolean;
  positionItem: IPositionItem;
  positionRemove: UseFieldArrayRemove;
  typeItem: ITypeItem;
}

export const ShiftTypePositionRemove = ({
  handleDialogRemoveClose,
  isDialogRemoveOpen,
  positionItem,
  positionRemove,
  typeItem,
}: IShiftTypePositionRemoveProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR(
    `/api/shifts/types/${typeItem.id}/position/${positionItem.id}`,
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
        handleDialogClose={handleDialogRemoveClose}
        isDialogOpen={isDialogRemoveOpen}
        text="Remove position"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogRemoveClose}
        isDialogOpen={isDialogRemoveOpen}
        text="Remove role"
      >
        <Loading />
      </DialogContainer>
    );

  const handlePositionRemove = async () => {
    positionRemove(positionItem.index);
    handleDialogRemoveClose();
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
      handleDialogClose={handleDialogRemoveClose}
      isDialogOpen={isDialogRemoveOpen}
      text="Remove position"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              Before doing so, <strong>{positionItem.name}</strong> volunteers
              must be removed from the position in the following dates and
              times:
            </Typography>
          </DialogContentText>
          <List sx={{ pl: 2, listStyleType: "disc" }}>
            {data.map((timeItem: ITimeItem) => {
              return (
                <ListItem
                  disablePadding
                  key={timeItem.id}
                  sx={{ display: "list-item", pl: 0 }}
                >
                  <ListItemText primary={timeItem.time} />
                </ListItem>
              );
            })}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to remove <strong>{positionItem.name}</strong>{" "}
            position?
          </Typography>
        </DialogContentText>
      )}
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
          disabled={data && data.length > 0}
          onClick={handlePositionRemove}
          startIcon={<PersonRemoveIcon />}
          type="submit"
          variant="contained"
        >
          Remove position
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
