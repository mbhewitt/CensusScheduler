import {
  Close as CloseIcon,
  GroupRemove as GroupRemoveIcon,
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

interface IPositionItem {
  id: number;
  index: number;
  name: string;
}
interface ITimeItem {
  id: number;
  name: string;
}
interface IShiftTypesPositionRemoveProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  positionItem: IPositionItem;
  positionRemove: UseFieldArrayRemove;
  typeId: number;
}

export const ShiftTypesPositionRemove = ({
  handleDialogClose: handleDialogRemoveClose,
  isDialogOpen: isDialogRemoveOpen,
  positionItem,
  positionRemove,
  typeId,
}: IShiftTypesPositionRemoveProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR(
    `/api/shifts/types/${typeId}/positions/${positionItem.id}`,
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
        text="Remove position"
      >
        <Loading />
      </DialogContainer>
    );

  const handlePositionRemove = async () => {
    positionRemove(positionItem.index);
    enqueueSnackbar(
      <SnackbarText>
        Click on the <strong>Update type</strong> button to finalize your
        changes
      </SnackbarText>,
      {
        variant: "warning",
      }
    );
    handleDialogRemoveClose();
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
              To remove <strong>{positionItem.name}</strong>, volunteers must be
              removed from this position in the following times:
            </Typography>
          </DialogContentText>
          <List sx={{ display: "inline-block", pl: 2, listStyleType: "disc" }}>
            {data.map((timeItem: ITimeItem) => {
              return (
                <ListItem
                  disablePadding
                  key={timeItem.id}
                  sx={{ display: "list-item", pl: 0 }}
                >
                  <Link href={`/shifts/volunteers/${timeItem.id}`}>
                    <ListItemText>{timeItem.name}</ListItemText>
                  </Link>
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
          startIcon={<GroupRemoveIcon />}
          type="submit"
          variant="contained"
        >
          Remove position
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
