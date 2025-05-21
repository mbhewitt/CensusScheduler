import {
  Close as CloseIcon,
  EventAvailable as EventAvailableIcon,
} from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import {
  DatesDialogForm,
  defaultValues,
  IFormValues,
} from "@/app/calendar/dates/DatesDialogForm";
import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import {
  // IReqDateItem,
  IResDateRowItem,
} from "@/components/types/calendar/dates";
import { fetcherTrigger } from "@/utils/fetcher";

interface IDatesDialogCreateProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  dateList: IResDateRowItem[];
}

export const DatesDialogCreate = ({
  handleDialogClose,
  isDialogOpen,
  dateList,
}: IDatesDialogCreateProps) => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  // const { isMutating, trigger } = useSWRMutation(
  const { isMutating } = useSWRMutation("/api/calendar/dates", fetcherTrigger);

  // other hooks
  // ------------------------------------------------------------
  const {
    clearErrors,
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
      clearErrors();
      setValue("date", "");
      setValue("name", "");
    }
  }, [clearErrors, isDialogOpen, setValue]);

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // const body: IReqDateItem = formValues;

      // // update database
      // await trigger({
      //   body,
      //   method: "POST",
      // });

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> date has been created
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
      text="Create date"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <DatesDialogForm
          control={control}
          errors={errors}
          dateName={defaultValues.name}
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
              isMutating ? (
                <CircularProgress size="1rem" />
              ) : (
                <EventAvailableIcon />
              )
            }
            type="submit"
            variant="contained"
          >
            Create role
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
