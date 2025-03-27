import {
  Close as CloseIcon,
  SpeakerNotes as SpeakerNotesIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContentText,
  FormControlLabel,
  FormLabel,
  Grid2 as Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { io } from "socket.io-client";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import { legendList } from "@/constants";
import { fetcherTrigger } from "@/utils/fetcher";
import { formatDateName, formatTime } from "@/utils/formatDateTime";

interface IFormValues {
  notes: string;
  rating: null | number;
}
interface IVolunteerShiftsDialogReviewProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shift: {
    dateName: string;
    endTime: string;
    positionName: string;
    startTime: string;
    timeId: number;
    timePositionId: number;
  };
  volunteer: {
    notes: string;
    rating: null | number;
    shiftboardId: number;
  };
}

const socket = io();
const defaultValues: IFormValues = {
  notes: "",
  rating: null,
};
export const VolunteerShiftsDialogReview = ({
  handleDialogClose,
  isDialogOpen,
  shift: { dateName, endTime, positionName, startTime, timeId, timePositionId },
  volunteer: { notes, rating, shiftboardId },
}: IVolunteerShiftsDialogReviewProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/volunteers/${timeId}/${shiftboardId}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });

  // side effects
  // --------------------
  useEffect(() => {
    if (isDialogOpen) {
      reset({
        rating: rating ?? 3,
        notes,
      });
    }
  }, [isDialogOpen]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // TODO: update database
      // await trigger({
      //   body: { notes, rating, shiftboardId, timePositionId },
      //   method: "PATCH",
      // });
      // emit event
      // socket.emit("req-shift-volunteer-notes", {
      //   notes,
      //   rating,
      //   shiftboardId,
      //   timePositionId,
      // });

      enqueueSnackbar(
        <SnackbarText>
          <strong>Review</strong> for{" "}
          <strong>{formatDateName(startTime, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> has been updated
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
      text="Update review"
    >
      <DialogContentText sx={{ mb: 1 }}>
        <Typography component="span">
          <strong>{formatDateName(startTime, dateName)}</strong> at{" "}
          <strong>{formatTime(startTime, endTime)}</strong> for{" "}
          <strong>{positionName}</strong>
        </Typography>
      </DialogContentText>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormLabel>Rating</FormLabel>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <RadioGroup {...field}>
                  {legendList.map((legendItem, index) => (
                    <FormControlLabel
                      control={<Radio color="secondary" />}
                      label={legendItem}
                      key={legendItem}
                      value={5 - index}
                    />
                  ))}
                </RadioGroup>
              )}
            />
          </Grid>
          <Grid size={12}>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextField
                  {...field}
                  error={Boolean(errors.notes)}
                  fullWidth
                  helperText={errors.notes?.message}
                  label="Notes"
                  multiline
                  variant="standard"
                />
              )}
            />
          </Grid>
        </Grid>
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
            startIcon={
              isMutating ? (
                <CircularProgress size="1rem" />
              ) : (
                <SpeakerNotesIcon />
              )
            }
            type="submit"
            variant="contained"
          >
            Update review
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
