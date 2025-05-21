import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import {
  DatesDialogForm,
  defaultValues,
  IFormValues,
} from "@/app/calendar/dates/DatesDialogForm";
import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import { IResDateRowItem } from "@/components/types/calendar/dates";
import { fetcherTrigger } from "@/utils/fetcher";

interface IDatesDialogUpdateProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  dateItem: IResDateRowItem;
  dateList: IResDateRowItem[];
}

export const DatesDialogUpdate = ({
  handleDialogClose,
  isDialogOpen,
  dateItem,
  dateList,
}: IDatesDialogUpdateProps) => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/dates/${dateItem.id}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

  // other hooks
  // ------------------------------------------------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    if (isDialogOpen) {
      setValue("date", dateItem.date);
      setValue("name", dateItem.name);
    }
  }, [isDialogOpen, dateItem, setValue]);

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: formValues,
        method: "PATCH",
      });
      mutate("/api/dates");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> date has been updated
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
      text="Update date"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <DatesDialogForm
          control={control}
          errors={errors}
          dateName={dateItem.name}
          dateList={dateList}
        />
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
            disabled={Object.keys(errors).length > 0 || isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <EditIcon />
            }
            type="submit"
            variant="contained"
          >
            Update date
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
