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
import { IReqReviewValues } from "@/components/types";
import { legendList, UPDATE_TYPE_REVIEW } from "@/constants";
import { fetcherTrigger } from "@/utils/fetcher";

interface IFormValues {
  notes: string;
  rating: null | number;
}
interface IShiftVolunteersDialogReviewProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shift: {
    positionName: string;
    timeId: number;
    timePositionId: number;
  };
  volunteer: {
    notes: string;
    playaName: string;
    rating: null | number;
    shiftboardId: number;
    worldName: string;
  };
}

const socket = io();
const defaultValues: IFormValues = {
  notes: "",
  rating: null,
};
export const ShiftVolunteersDialogReview = ({
  handleDialogClose,
  isDialogOpen,
  shift: { positionName, timeId, timePositionId },
  volunteer: { notes, playaName, rating, shiftboardId, worldName },
}: IShiftVolunteersDialogReviewProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/volunteers/${timeId}`,
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
        rating: rating ?? 3, // 3 is default rating value
        notes,
      });
    }
  }, [isDialogOpen, notes, rating, reset]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async ({ notes, rating }) => {
    const body: IReqReviewValues = {
      notes,
      rating: rating as number,
      shiftboardId,
      timePositionId,
      updateType: UPDATE_TYPE_REVIEW,
    };

    try {
      // update database
      await trigger({ body, method: "PATCH" });
      // emit event
      socket.emit("req-review-update", {
        notes,
        rating,
        shiftboardId,
        timePositionId,
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>Review</strong> for{" "}
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          has been updated
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
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>{" "}
          for <strong>{positionName}</strong>
        </Typography>
      </DialogContentText>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid size={6}>
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
