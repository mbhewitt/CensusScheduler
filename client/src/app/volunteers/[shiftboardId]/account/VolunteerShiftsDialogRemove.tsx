import {
  Close as CloseIcon,
  EventBusy as EventBusyIcon,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  DialogActions,
  DialogContentText,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import { REMOVE_SHIFT_VOLUNTEER_REQ } from "@/constants";
import { fetcherTrigger } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";

interface IVolunteerShiftsDialogRemoveProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shift: {
    critical: boolean;
    date: string;
    dateName: string;
    endTime: string;
    positionName: string;
    startTime: string;
    timePositionId: number;
  };
  volunteer: {
    shiftboardId: number;
  };
}

const socket = io();
export const VolunteerShiftsDialogRemove = ({
  handleDialogClose,
  isDialogOpen,
  shift: {
    critical,
    date,
    dateName,
    endTime,
    positionName,
    startTime,
    timePositionId,
  },
  volunteer: { shiftboardId },
}: IVolunteerShiftsDialogRemoveProps) => {
  // #308 warn-then-allow: dropping a critical position requires an explicit
  // acknowledgment before the Remove button enables. Reset on every open.
  const [isGapAcknowledged, setIsGapAcknowledged] = useState(false);
  useEffect(() => {
    if (isDialogOpen) setIsGapAcknowledged(false);
  }, [isDialogOpen]);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/shifts`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // ------------------------------------------------------------
  const handleVolunteerRemove = async () => {
    try {
      // update database
      await trigger({
        body: { shiftboardId, timePositionId },
        method: "DELETE",
      });
      // emit event
      socket.emit(REMOVE_SHIFT_VOLUNTEER_REQ, {
        shiftboardId,
        timePositionId,
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formatDateName(date, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> for{" "}
          <strong>{positionName}</strong> has been removed
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
      text="Remove volunteer shift"
    >
      <DialogContentText>
        <Typography component="span">
          Are you sure you want to remove{" "}
          <strong>{formatDateName(date, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> for{" "}
          <strong>{positionName}</strong>?
        </Typography>
      </DialogContentText>
      {critical && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>{positionName}</strong> is a critical position — removing this
          shift leaves a gap that must be refilled. The Census volunteer
          coordinators will be notified.
          <FormControlLabel
            control={
              <Checkbox
                checked={isGapAcknowledged}
                onChange={(event) => setIsGapAcknowledged(event.target.checked)}
              />
            }
            label="I understand this leaves a critical position unfilled"
            sx={{ display: "flex", mt: 1 }}
          />
        </Alert>
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
          disabled={isMutating || (critical && !isGapAcknowledged)}
          onClick={handleVolunteerRemove}
          startIcon={
            isMutating ? <CircularProgress size="1rem" /> : <EventBusyIcon />
          }
          type="submit"
          variant="contained"
        >
          Remove shift
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
