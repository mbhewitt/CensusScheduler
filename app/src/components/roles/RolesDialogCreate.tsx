import { Add as AddIcon } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import io from "socket.io-client";
import useSWRMutation from "swr/mutation";

import { DialogHeader } from "src/components/general/DialogHeader";
import { SnackbarText } from "src/components/general/SnackbarText";
import { fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  name: string;
}
interface IDataRoleItem {
  display: boolean;
  name: string;
}
interface IRolesDialogCreateProps {
  handleDialogCreateClose: () => void;
  isDialogCreateOpen: boolean;
  roleList: IDataRoleItem[];
}

const socket = io();
const defaultValues: IFormValues = {
  name: "",
};
export const RolesDialogCreate = ({
  handleDialogCreateClose,
  isDialogCreateOpen,
  roleList,
}: IRolesDialogCreateProps) => {
  const { isMutating, trigger } = useSWRMutation("/api/roles", fetcherTrigger);
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

  // handle form submission
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const isRoleAvailable = roleList.some(
        ({ name }: { name: string }) => name === dataForm.name
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
      await trigger({ body: dataForm, method: "POST" });
      // emit shift update
      socket.emit("req-role-create", {
        dataForm,
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

  return (
    <Dialog
      fullWidth
      onClose={handleDialogCreateClose}
      open={isDialogCreateOpen}
    >
      <DialogHeader
        handleDialogClose={handleDialogCreateClose}
        text="Create role"
      />
      <DialogContent>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                {...field}
                autoComplete="off"
                disabled={isMutating}
                fullWidth
                label="Name"
                required
                variant="standard"
              />
            )}
          />
          <DialogActions>
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
      </DialogContent>
    </Dialog>
  );
};
