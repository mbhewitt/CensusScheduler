import {
  AddModerator as AddModeratorIcon,
  Close as CloseIcon,
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
  RolesDialogForm,
} from "src/components/roles/RolesDialogForm";
import type { IResRoleItem } from "src/components/types";
import { fetcherTrigger } from "src/utils/fetcher";

interface IRolesDialogCreateProps {
  handleDialogCreateClose: () => void;
  isDialogCreateOpen: boolean;
  roleList: IResRoleItem[];
}

export const RolesDialogCreate = ({
  handleDialogCreateClose,
  isDialogCreateOpen,
  roleList,
}: IRolesDialogCreateProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation("/api/roles", fetcherTrigger);

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
          <strong>{formValues.name}</strong> role has been created
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
      text="Create role"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <RolesDialogForm
          control={control}
          errors={errors}
          roleList={roleList}
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
