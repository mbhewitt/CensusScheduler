import {
  Close as CloseIcon,
  LockReset as LockResetIcon,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  DialogActions,
  DialogContentText,
  Stack,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import { PasscodeForm } from "@/app/volunteers/account/PasscodeForm";
import { DialogContainer } from "@/components/general/DialogContainer";
import { SnackbarText } from "@/components/general/SnackbarText";
import type { IVolunteerAccountFormValues } from "@/components/types";
import type { IReqPasscode } from "@/components/types/volunteers";
import { ensure } from "@/utils/ensure";
import { fetcherTrigger } from "@/utils/fetcher";

interface IPasscodeDialogUpdateProps {
  handleDialogClose: () => void;
  isDialogOpen: boolean;
  playaName: string;
  shiftboardId: number;
  worldName: string;
}

const defaultValues: IVolunteerAccountFormValues = {
  passcodeConfirm: "",
  passcodeCreate: "",
};
export const PasscodeDialogUpdate = ({
  handleDialogClose,
  isDialogOpen,
  shiftboardId,
  playaName,
  worldName,
}: IPasscodeDialogUpdateProps) => {
  // state
  // ------------------------------------------------------------
  const [isPasscodeCreateVisible, setIsPasscodeCreateVisible] = useState(false);
  const [isPasscodeConfirmVisible, setIsPasscodeConfirmVisible] =
    useState(false);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/account/passcode`,
    fetcherTrigger
  );

  // other hooks
  // ------------------------------------------------------------
  const {
    clearErrors,
    control,
    formState: { errors },
    getValues,
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
      setValue("passcodeCreate", "");
      setValue("passcodeConfirm", "");
    }
  }, [clearErrors, isDialogOpen, setValue]);

  // form submission
  // ------------------------------------------------------------
  const onSubmit: SubmitHandler<IVolunteerAccountFormValues> = async (
    formValues
  ) => {
    try {
      const body: IReqPasscode = {
        passcode: ensure(formValues.passcodeCreate),
      };

      // update database
      await trigger({
        body,
        method: "PATCH",
      });

      enqueueSnackbar(
        <SnackbarText>
          <strong>
            {playaName} &quot;{worldName}&quot;
          </strong>
          &apos;s passcode has been reset
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
      text="Update passcode"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <DialogContentText paragraph>
          <Typography component="span">
            Enter a new passcode for{" "}
            <strong>
              {playaName} &quot;{worldName}&quot;
            </strong>
          </Typography>
        </DialogContentText>

        <Stack spacing={2}>
          <PasscodeForm
            control={control}
            errors={errors}
            getValues={getValues}
            isPasscodeConfirmVisible={isPasscodeConfirmVisible}
            isPasscodeCreateVisible={isPasscodeCreateVisible}
            setIsPasscodeConfirmVisible={setIsPasscodeConfirmVisible}
            setIsPasscodeCreateVisible={setIsPasscodeCreateVisible}
          />
        </Stack>
        <DialogActions>
          <Button
            disabled={isMutating}
            onClick={handleDialogClose}
            startIcon={<CloseIcon />}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <LockResetIcon />
            }
            type="submit"
            variant="contained"
          >
            Update passcode
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
