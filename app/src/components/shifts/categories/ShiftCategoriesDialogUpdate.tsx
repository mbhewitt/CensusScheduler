import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
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

interface IShiftCategoriesDialogUpdateProps {
  handleDialogUpdateClose: () => void;
  isDialogUpdateOpen: boolean;
  shiftCategory: IResShiftCategoryItem;
  shiftCategoryList: IResShiftCategoryItem[];
}

export const ShiftCategoriesDialogUpdate = ({
  handleDialogUpdateClose,
  isDialogUpdateOpen,
  shiftCategory,
  shiftCategoryList,
}: IShiftCategoriesDialogUpdateProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/categories/${shiftCategory.id}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // --------------------
  useEffect(() => {
    setValue("category", shiftCategory.category);
    setValue("id", shiftCategory.id);
    setValue("name", shiftCategory.name);
  }, [shiftCategory, setValue]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: formValues,
        method: "PATCH",
      });
      mutate("/api/shifts/categories");

      handleDialogUpdateClose();
      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> shift category has been updated
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
      handleDialogClose={handleDialogUpdateClose}
      isDialogOpen={isDialogUpdateOpen}
      text="Update shift category"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <ShiftCategoriesDialogForm
          control={control}
          errors={errors}
          shiftCategory={shiftCategory}
          shiftCategoryList={shiftCategoryList}
        />
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
            }
            onClick={() => {
              handleDialogUpdateClose();
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
