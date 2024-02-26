import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { Autocomplete, Button, DialogActions, TextField } from "@mui/material";
import axios from "axios";
import { useSnackbar } from "notistack";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR, { useSWRConfig } from "swr";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type { IVolunteerItem } from "src/components/types";
import { fetcherGet } from "src/utils/fetcher";

interface IVolunteer {
  label: string;
  shiftboardId: string;
}
interface IFormValues {
  volunteer: null | IVolunteer;
}
interface IRoleVolunteerItem {
  roleName: string;
  playaName: string;
  shiftboardId: number;
  worldName: string;
}
interface IRoleVolunteersDialogAddProps {
  handleDialogAddClose: () => void;
  isDialogAddOpen: boolean;
  roleId: string | string[] | undefined;
  roleName: string;
  roleVolunteerList: IRoleVolunteerItem[];
}

const defaultValues: IFormValues = {
  volunteer: null,
};
export const RoleVolunteersDialogAdd = ({
  handleDialogAddClose,
  isDialogAddOpen,
  roleId,
  roleName,
  roleVolunteerList,
}: IRoleVolunteersDialogAddProps) => {
  const { data, error } = useSWR("/api/volunteers/dropdown", fetcherGet);
  const { mutate } = useSWRConfig();
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

  if (error)
    return (
      <DialogContainer
        handleDialogClose={handleDialogAddClose}
        isDialogOpen={isDialogAddOpen}
        text="Add role volunteer"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogAddClose}
        isDialogOpen={isDialogAddOpen}
        text="Add role volunteer"
      >
        <Loading />
      </DialogContainer>
    );

  // handle form submission
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const roleVolunteerAdd = data.find(
        (dataVolunteerItem: IVolunteerItem) =>
          dataVolunteerItem.shiftboardId === dataForm.volunteer?.shiftboardId
      );
      const isRoleVolunteerAvailable = roleVolunteerList.some(
        ({ shiftboardId }) => shiftboardId === roleVolunteerAdd.shiftboardId
      );

      // if the role volunteer has been added already
      // then display an error
      if (isRoleVolunteerAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {roleVolunteerAdd.playaName} &quot;{roleVolunteerAdd.worldName}
              &quot;
            </strong>{" "}
            for <strong>{roleName}</strong> role has been added already
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }

      // update database
      await axios.post(`/api/role-volunteers/${roleId}`, {
        shiftboardId: dataForm.volunteer?.shiftboardId,
      });
      mutate(`/api/role-volunteers/${roleId}`);

      handleDialogAddClose();
      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {roleVolunteerAdd.playaName} &quot;{roleVolunteerAdd.worldName}
            &quot;
          </strong>{" "}
          for <strong>{roleName}</strong> role has been added
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
      handleDialogClose={handleDialogAddClose}
      isDialogOpen={isDialogAddOpen}
      text="Add role volunteer"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="volunteer"
          render={({ field }) => (
            <Autocomplete
              {...field}
              fullWidth
              isOptionEqualToValue={(option, value: IVolunteer) =>
                option.shiftboardId === value.shiftboardId ||
                value.shiftboardId === ""
              }
              onChange={(_, data) => field.onChange(data)}
              options={data.map(
                ({ playaName, shiftboardId, worldName }: IVolunteerItem) => ({
                  label: `${playaName} "${worldName}"`,
                  shiftboardId,
                })
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Name"
                  required
                  variant="standard"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.shiftboardId}>
                  {option.label}
                </li>
              )}
            />
          )}
        />
        <DialogActions>
          <Button
            startIcon={<CloseIcon />}
            onClick={() => {
              handleDialogAddClose();
              reset(defaultValues);
            }}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            startIcon={<PersonAddIcon />}
            type="submit"
            variant="contained"
          >
            Add
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
