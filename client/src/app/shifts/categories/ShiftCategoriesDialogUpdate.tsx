import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import {
  defaultValues,
  IFormValues,
  ShiftCategoriesDialogForm,
} from "@/app/shifts/categories/ShiftCategoriesDialogForm";
import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import type {
  IReqShiftCategoryItem,
  IResShiftCategoryItem,
} from "@/components/types/shifts/categories";
import { fetcherTrigger } from "@/utils/fetcher";

interface IShiftCategoriesDialogUpdateProps {
  categoryItem: IResShiftCategoryItem;
  categoryList: IResShiftCategoryItem[];
  handleDialogClose: () => void;
  isDialogOpen: boolean;
}

export const ShiftCategoriesDialogUpdate = ({
  categoryItem,
  categoryList,
  handleDialogClose,
  isDialogOpen,
}: IShiftCategoriesDialogUpdateProps) => {
  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/categories/${categoryItem.id}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

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
      setValue("department.name", categoryItem.department.name);
      setValue("name", categoryItem.name);
    }
  }, [categoryItem, clearErrors, isDialogOpen, setValue]);

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqShiftCategoryItem = formValues;

      // update database
      await trigger({
        body,
        method: "PATCH",
      });
      mutate("/api/shifts/categories");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> category has been updated
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
      text="Update shift category"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <ShiftCategoriesDialogForm
          categoryList={categoryList}
          categoryName={categoryItem.name}
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
              isMutating ? <CircularProgress size="1rem" /> : <EditIcon />
            }
            type="submit"
            variant="contained"
          >
            Update shift category
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
