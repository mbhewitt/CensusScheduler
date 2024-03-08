import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { Button, DialogActions, TextField } from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useSWRConfig } from "swr";

import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";
import type { IResRoleItem } from "src/components/types";

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
  const { mutate } = useSWRConfig();
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

  // handle form submission
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const isRoleAvailable = roleList.some(
        ({ roleName }) => roleName === dataForm.name
      );

      // if the role has been added already
      // then display an error
      if (isRoleAvailable) {
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
      await axios.post("/api/roles", dataForm);
      mutate("/api/roles");

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
              label="Name"
              required
              variant="standard"
            />
          )}
        />
        <DialogActions>
          <Button
            startIcon={<CloseIcon />}
            onClick={() => {
              handleDialogCreateClose();
              reset(defaultValues);
            }}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button startIcon={<AddIcon />} type="submit" variant="contained">
            Create
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
