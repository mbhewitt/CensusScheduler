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
  categoryItem: IResShiftCategoryItem;
  categoryList: IResShiftCategoryItem[];
  handleDialogClose: () => void;
  isDialogOpen: boolean;
}

export const ShiftCategoriesDialogCreate = ({
  categoryItem,
  categoryList,
  handleDialogClose,
  isDialogOpen,
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
      setValue("departmentName", categoryItem.departmentName);
      setValue("name", categoryItem.name);
    }
  }, [categoryItem, clearErrors, isDialogOpen, setValue]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: formValues,
        method: "POST",
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> category has been created
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
      text="Create category"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <ShiftCategoriesDialogForm
          categoryList={categoryList}
          categoryName={defaultValues.name}
          control={control}
          errors={errors}
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
                <PlaylistAddIcon />
              )
            }
            type="submit"
            variant="contained"
          >
            Create category
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
