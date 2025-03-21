import {
  Close as CloseIcon,
  SpeakerNotes as SpeakerNotesIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContentText,
  Grid2 as Grid,
  List,
  ListItem,
  Rating,
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
const legendList = [
  "Consider for leadership",
  "Exceeds expections",
  "Meets expectations",
  "Needs coaching",
  "Not a good fit",
];
export const ShiftVolunteersDialogReview = ({
  handleDialogClose,
  isDialogOpen,
  shift: { positionName, timeId, timePositionId },
  volunteer: { notes, playaName, rating, shiftboardId, worldName },
}: IShiftVolunteersDialogReviewProps) => {
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
        rating,
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
            <Typography>Rating</Typography>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => <Rating {...field} />}
            />
          </Grid>
          <Grid size={6}>
            <List disablePadding>
              {legendList.map((legendItem, index) => {
                return (
                  <ListItem
                    disableGutters
                    disablePadding
                    key={legendItem}
                    sx={{ display: "flex" }}
                  >
                    <Typography>{legendList.length - index}</Typography>
                    <StarIcon color="secondary" sx={{ pb: "2px" }} />
                    <Typography>: {legendItem}</Typography>
                  </ListItem>
                );
              })}
            </List>
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
