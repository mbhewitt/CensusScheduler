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
import { useContext, useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "@/components/general/DialogContainer";
import { ErrorAlert } from "@/components/general/ErrorAlert";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IVolunteerOption } from "@/components/types";
import type {
  IReqRoleVolunteerItem,
  IResRoleRowItem,
  IResRoleVolunteerItem,
} from "@/components/types/roles";
import type { IResVolunteerDefaultItem } from "@/components/types/volunteers";
import { SESSION_ROLE_ITEM_ADD } from "@/constants";
import { SessionContext } from "@/state/session/context";
import { ensure } from "@/utils/ensure";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

interface IFormValues {
  volunteer: null | IVolunteerOption;
}
interface IRoleVolunteersDialogAddProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  roleItem: IResRoleRowItem;
  roleVolunteerList: IResRoleVolunteerItem[];
}

const defaultValues: IFormValues = {
  volunteer: null,
};
export const RoleVolunteersDialogAdd = ({
  handleDialogClose,
  isDialogOpen,
  roleItem: { id: roleId, name: roleName },
  roleVolunteerList,
}: IRoleVolunteersDialogAddProps) => {
  // context
  // ------------------------------------------------------------
  const {
    sessionDispatch,
    sessionState: {
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IResVolunteerDefaultItem[];
    error: Error | undefined;
  } = useSWR("/api/volunteers/dropdown", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    `/api/roles/volunteers/${roleId}`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
  useEffect(() => {
    if (isDialogOpen) {
      clearErrors();
      setValue("volunteer", null);
    }
  }, [clearErrors, isDialogOpen, setValue]);

  // logic
  // ------------------------------------------------------------
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
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const body: IReqRoleVolunteerItem = {
        shiftboardId: ensure(formValues.volunteer?.shiftboardId),
      };

      // update database
      await trigger({
        body,
        method: "POST",
      });
      // if the selected volunteer is the same as the authenticated volunteer
      // then update state
      if (formValues.volunteer?.shiftboardId === shiftboardId) {
        sessionDispatch({
          payload: {
            id: roleId,
            name: roleName,
          },
          type: SESSION_ROLE_ITEM_ADD,
        });
      }

      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.volunteer?.label}</strong> for{" "}
          <strong>{roleName}</strong> role has been added
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
  // ------------------------------------------------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
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
              onChange={(_event, value) => field.onChange(value)}
              options={data.map(({ playaName, shiftboardId, worldName }) => ({
                label: `${playaName} "${worldName}"`,
                shiftboardId,
              }))}
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
