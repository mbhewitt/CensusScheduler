import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";
import type { IResRoleItem } from "src/components/types";
import { fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  name: string;
}
interface IRolesDialogCreateProps {
  handleDialogCreateClose: () => void;
  isDialogCreateOpen: boolean;
  roleList: IResRoleItem[];
}

const defaultValues: IFormValues = {
  name: "",
};
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
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const isRoleAvailable = roleList.every(
        ({ roleName }) => roleName !== dataForm.name
      );

      // if the role has been added already
      // then display error
      if (!isRoleAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{dataForm.name}</strong> role has been added already
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }

      // update database
      await trigger({
        body: dataForm,
        method: "POST",
      });

      handleDialogCreateClose();
      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{dataForm.name}</strong> role has been created
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

  // display
  // --------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogCreateClose}
      isDialogOpen={isDialogCreateOpen}
      text="Create role"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              {...field}
              autoComplete="off"
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              label="Name"
              required
              variant="standard"
            />
          )}
          rules={{
            required: "Name is required",
            validate: (value) => {
              return Boolean(value.trim()) || "Name is required";
            },
          }}
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
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <AddIcon />
            }
            type="submit"
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
