import {
  Close as CloseIcon,
  EventBusy as EventBusyIcon,
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

import { DialogContainer } from "@/components/general/DialogContainer";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IResDateRowItem } from "@/components/types/dates";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { formatDateYear } from "@/utils/formatDateTime";

interface IDatesDialogDeleteProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  dateItem: IResDateRowItem;
}

export const DatesDialogDelete = ({
  handleDialogClose,
  isDialogOpen,
  dateItem: { date, id, name },
}: IDatesDialogDeleteProps) => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IResDateRowItem[];
    error: Error | undefined;
  } = useSWR(`/api/dates/${id}/shift-times`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/dates/${id}`,
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
        text="Delete date"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Delete date"
      >
        <Loading />
      </DialogContainer>
    );

  const handleDateDelete = async () => {
    try {
      // update database
      await trigger({
        method: "DELETE",
      });
      mutate("/api/dates");

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {formatDateYear(date)} - {name}
          </strong>{" "}
          date has been deleted
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
      text="Delete date"
    >
      {data && data.length > 0 ? (
        <>
          <DialogContentText>
            <Typography component="span">
              To delete{" "}
              <strong>
                {formatDateYear(date)} - {name}
              </strong>
              , this date must be removed from the following shift types:
            </Typography>
          </DialogContentText>
          <List sx={{ pl: 2, listStyleType: "disc" }}>
            {data.map(({ id: shiftTimeId, name: shiftTimeName }) => {
              return (
                <ListItem
                  disablePadding
                  key={shiftTimeId}
                  sx={{ display: "list-item", pl: 0 }}
                >
                  <ListItemText primary={shiftTimeName} />
                </ListItem>
              );
            })}
          </List>
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete{" "}
            <strong>
              {formatDateYear(date)} - {name}
            </strong>{" "}
            date?
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
          onClick={handleDateDelete}
          startIcon={
            isMutating ? <CircularProgress size="1rem" /> : <EventBusyIcon />
          }
          type="submit"
          variant="contained"
        >
          Delete date
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
