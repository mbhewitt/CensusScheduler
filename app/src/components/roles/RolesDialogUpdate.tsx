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
  RolesDialogForm,
} from "src/components/roles/RolesDialogForm";
import type { IResRoleListItem } from "src/components/types/roles";
import { fetcherTrigger } from "src/utils/fetcher";

interface IRolesDialogUpdateProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  roleItem: IResRoleListItem;
  roleList: IResRoleListItem[];
}

export const RolesDialogUpdate = ({
  handleDialogClose,
  isDialogOpen,
  roleItem,
  roleList,
}: IRolesDialogUpdateProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/roles/${roleItem.id}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

  // other hooks
  // --------------------
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
  // --------------------
  useEffect(() => {
    if (isDialogOpen) {
      setValue("name", roleItem.name);
    }
  }, [isDialogOpen, roleItem, setValue]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: formValues,
        method: "PATCH",
      });
      mutate("/api/roles");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> role has been updated
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
      text="Update role"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <RolesDialogForm
          control={control}
          errors={errors}
          roleName={roleItem.name}
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
              isMutating ? <CircularProgress size="1rem" /> : <EditIcon />
            }
            type="submit"
            variant="contained"
          >
            Update role
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
