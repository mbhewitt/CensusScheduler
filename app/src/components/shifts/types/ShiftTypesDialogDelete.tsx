import {
  Close as CloseIcon,
  EventBusy as EventBusyIcon,
} from "@mui/icons-material";
import {
  Box,
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
import type {
  IResShiftTypeCurrent,
  IResShiftTypeRowItem,
} from "src/components/types/shifts/types";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";
import { formatDateName, formatTime } from "src/utils/formatDateTime";

interface IShiftTypesDialogDeleteProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  typeItem: IResShiftTypeRowItem;
}

export const ShiftTypesDialogDelete = ({
  handleDialogClose,
  isDialogOpen,
  typeItem: { id, name },
}: IShiftTypesDialogDeleteProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResShiftTypeCurrent;
    error: Error | undefined;
  } = useSWR(`/api/shifts/types/${id}`, fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/types/${id}`,
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
        text="Delete type"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Delete type"
      >
        <Loading />
      </DialogContainer>
    );

  const handleShiftTypeDelete = async () => {
    try {
      // update database
      await trigger({
        method: "DELETE",
      });
      mutate("/api/shifts/types");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> type has been deleted
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
      text="Delete type"
    >
      {data && (data.positionList.length > 0 || data.timeList.length > 0) ? (
        <>
          <DialogContentText sx={{ mb: 2 }}>
            <Typography component="span">
              To delete <strong>{name}</strong>, the following must be removed
              from this type:
            </Typography>
          </DialogContentText>
          {data.positionList.length > 0 && (
            <Box>
              <Typography>
                <strong>Positions</strong>
              </Typography>
              <List
                sx={{ display: "inline-block", pl: 2, listStyleType: "disc" }}
              >
                {data.positionList.map(({ positionId, name }) => {
                  return (
                    <ListItem
                      disablePadding
                      key={positionId}
                      sx={{ display: "list-item", pl: 0 }}
                    >
                      <ListItemText>{name}</ListItemText>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          {data.timeList.length > 0 && (
            <Box>
              <Typography>
                <strong>Times</strong>
              </Typography>
              <List
                sx={{ display: "inline-block", pl: 2, listStyleType: "disc" }}
              >
                {data.timeList.map(({ date, endTime, timeId, startTime }) => {
                  return (
                    <ListItem
                      disablePadding
                      key={timeId}
                      sx={{ display: "list-item", pl: 0 }}
                    >
                      <ListItemText>{`${formatDateName(date)}, ${formatTime(
                        startTime,
                        endTime
                      )}`}</ListItemText>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </>
      ) : (
        <DialogContentText>
          <Typography component="span">
            Are you sure you want to delete <strong>{name}</strong> type?
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
          disabled={
            (data &&
              data.positionList.length > 0 &&
              data.timeList.length > 0) ||
            isMutating
          }
          onClick={handleShiftTypeDelete}
          startIcon={
            isMutating ? <CircularProgress size="1rem" /> : <EventBusyIcon />
          }
          type="submit"
          variant="contained"
        >
          Delete type
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
