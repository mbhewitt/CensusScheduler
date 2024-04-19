import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  CircularProgress,
  DialogActions,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorAlert } from "src/components/general/ErrorAlert";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import type {
  IResRoleVolunteerItem,
  IResVolunteerDropdownItem,
  IVolunteerOption,
} from "src/components/types";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IFormValues {
  volunteer: null | IVolunteerOption;
}
interface IRoleVolunteersDialogAddProps {
  handleDialogAddClose: () => void;
  isDialogAddOpen: boolean;
  roleId: string | string[] | undefined;
  roleName: string;
  roleVolunteerList: IResRoleVolunteerItem[];
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
  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/volunteers/dropdown", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/roles/volunteers/${roleId}`,
    fetcherTrigger
  );

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

  // logic
  // --------------------
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

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const roleVolunteerAdd = data.find(
        (dataVolunteerItem: IResVolunteerDropdownItem) =>
          dataVolunteerItem.shiftboardId === formValues.volunteer?.shiftboardId
      );

      // update database
      await trigger({
        body: {
          shiftboardId: formValues.volunteer?.shiftboardId,
        },
        method: "POST",
      });

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

  // display
  // --------------------
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
              isOptionEqualToValue={(option, value: IVolunteerOption) =>
                option.shiftboardId === value.shiftboardId
              }
              onChange={(_, data) => field.onChange(data)}
              options={data.map(
                ({
                  playaName,
                  shiftboardId,
                  worldName,
                }: IResVolunteerDropdownItem) => ({
                  label: `${playaName} "${worldName}"`,
                  shiftboardId,
                })
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(errors.volunteer)}
                  helperText={errors.volunteer?.message}
                  label="Name"
                  required
                  variant="standard"
                />
              )}
            />
          )}
          rules={{
            required: "Volunteer is required",
            validate: (value) => {
              if (value) {
                const isRoleVolunteerAvailable = roleVolunteerList.every(
                  ({ shiftboardId }) => shiftboardId !== value.shiftboardId
                );

                return (
                  isRoleVolunteerAvailable ||
                  `${value.label} for ${roleName} role has been added already`
                );
              }

              return "";
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
              handleDialogAddClose();
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
              isMutating ? <CircularProgress size="1rem" /> : <PersonAddIcon />
            }
            type="submit"
            variant="contained"
          >
            Add volunteer
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
