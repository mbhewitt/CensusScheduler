import {
  Close as CloseIcon,
  PlaylistAdd as PlaylistAddIcon,
} from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";
import {
  defaultValues,
  IFormValues,
  ShiftCategoriesDialogForm,
} from "src/components/shifts/categories/ShiftCategoriesDialogForm";
import type { IResShiftCategoryItem } from "src/components/types";
import { fetcherTrigger } from "src/utils/fetcher";

interface IShiftCategoriesDialogCreateProps {
  handleDialogCreateClose: () => void;
  isDialogCreateOpen: boolean;
  shiftCategoryList: IResShiftCategoryItem[];
}

export const ShiftCategoriesDialogCreate = ({
  handleDialogCreateClose,
  isDialogCreateOpen,
  shiftCategoryList,
}: IShiftCategoriesDialogCreateProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    "/api/shifts/categories",
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const { enqueueSnackbar } = useSnackbar();

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: formValues,
        method: "POST",
      });

      handleDialogCreateClose();
      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> shift category has been created
        </SnackbarText>,
        {
          variant: "success",
        }
      );
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
      handleDialogClose={handleDialogCreateClose}
      isDialogOpen={isDialogCreateOpen}
      text="Create shift category"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <ShiftCategoriesDialogForm
          control={control}
          errors={errors}
          shiftCategory={defaultValues}
          shiftCategoryList={shiftCategoryList}
        />
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
            }
            onClick={() => {
              handleDialogCreateClose();
              reset(defaultValues);
            }}
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
                <PlaylistAddIcon />
              )
            }
            type="submit"
            variant="contained"
          >
            Create shift category
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
