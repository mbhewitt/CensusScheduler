import {
  Close as CloseIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  CircularProgress,
  DialogActions,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
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
  name: null | IVolunteerOption;
}
interface IRoleVolunteersDialogAddProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  roleItem: {
    id: number;
    name: string;
  };
  roleVolunteerList: IResRoleVolunteerItem[];
}

const defaultValues: IFormValues = {
  name: null,
};
export const RoleVolunteersDialogAdd = ({
  handleDialogClose,
  isDialogOpen,
  roleItem: { id: roleId, name: roleName },
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
      setValue("name", null);
    }
  }, [clearErrors, isDialogOpen, setValue]);

  // logic
  // --------------------
  if (error)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Add role volunteer"
      >
        <ErrorAlert />
      </DialogContainer>
    );
  if (!data)
    return (
      <DialogContainer
        handleDialogClose={handleDialogClose}
        isDialogOpen={isDialogOpen}
        text="Add role volunteer"
      >
        <Loading />
      </DialogContainer>
    );

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: {
          id: formValues.name?.id,
        },
        method: "POST",
      });

      handleDialogClose();
      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name?.label}</strong> for{" "}
          <strong>{roleName}</strong> role has been added
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
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
      text="Add role volunteer"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Autocomplete
              {...field}
              fullWidth
              isOptionEqualToValue={(option, value: IVolunteerOption) =>
                option.id === value.id
              }
              onChange={(_, data) => field.onChange(data)}
              options={data.map(
                ({ id, playaName, worldName }: IResVolunteerDropdownItem) => ({
                  id,
                  label: `${playaName} "${worldName}"`,
                })
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  label="Name"
                  required
                  variant="standard"
                />
              )}
            />
          )}
          rules={{
            required: "Name is required",
            validate: (value) => {
              if (value) {
                const isRoleVolunteerAvailable = roleVolunteerList.every(
                  ({ id }) => id !== value.id
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
                <PersonAddAlt1Icon />
              )
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
