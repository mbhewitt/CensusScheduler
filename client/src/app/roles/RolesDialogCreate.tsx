import {
  AddModerator as AddModeratorIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import {
  defaultValues,
  IFormValues,
  RolesDialogForm,
} from "@/app/roles/RolesDialogForm";
import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IReqRoleItem, IResRoleRowItem } from "@/components/types/roles";
import { fetcherTrigger } from "@/utils/fetcher";

interface IRolesDialogCreateProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  roleList: IResRoleRowItem[];
}

export const RolesDialogCreate = ({
  handleDialogClose,
  isDialogOpen,
  roleList,
}: IRolesDialogCreateProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation("/api/roles", fetcherTrigger);

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
      setValue("name", "");
    }
  }, [clearErrors, isDialogOpen, setValue]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqRoleItem = formValues;

      // update database
      await trigger({
        body,
        method: "POST",
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> role has been created
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
      text="Create role"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <RolesDialogForm
          control={control}
          errors={errors}
          roleName={defaultValues.name}
          roleList={roleList}
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
                <AddModeratorIcon />
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
