import {
  Close as CloseIcon,
  PlaylistAdd as PlaylistAddIcon,
} from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
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
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  shiftCategoryItem: IResShiftCategoryItem;
  shiftCategoryList: IResShiftCategoryItem[];
}

export const ShiftCategoriesDialogCreate = ({
  handleDialogClose,
  isDialogOpen,
  shiftCategoryItem,
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
  // --------------------
  useEffect(() => {
    if (isDialogOpen) {
      clearErrors();
      setValue("category", shiftCategoryItem.category);
      setValue("name", shiftCategoryItem.name);
    }
  }, [clearErrors, isDialogOpen, shiftCategoryItem, setValue]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: formValues,
        method: "POST",
      });

      // display success notification
      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> shift category has been created
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
      text="Create shift category"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <ShiftCategoriesDialogForm
          control={control}
          errors={errors}
          shiftCategoryName={defaultValues.name}
          shiftCategoryList={shiftCategoryList}
        />
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
            }
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
