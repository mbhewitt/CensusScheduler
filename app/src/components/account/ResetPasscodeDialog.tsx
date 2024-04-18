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
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";

import { ResetPasscodeForm } from "src/components/account/ResetPasscodeForm";
import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";
import type { IVolunteerAccountFormValues } from "src/components/types";
import { fetcherTrigger } from "src/utils/fetcher";

interface IResetPasscodeDialogProps {
  handleResetPasscodeDialogClose: () => void;
  isResetPasscodeDialogOpen: boolean;
  shiftboardId: string;
  playaName: string;
  worldName: string;
}

const defaultValues: IVolunteerAccountFormValues = {
  passcodeConfirm: "",
  passcodeCreate: "",
};
export const ResetPasscodeDialog = ({
  handleResetPasscodeDialogClose,
  isResetPasscodeDialogOpen,
  shiftboardId,
  playaName,
  worldName,
}: IResetPasscodeDialogProps) => {
  // state
  // --------------------
  const [isPasscodeCreateVisible, setIsPasscodeCreateVisible] = useState(false);
  const [isPasscodeConfirmVisible, setIsPasscodeConfirmVisible] =
    useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/account/${shiftboardId}/passcode`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const { enqueueSnackbar } = useSnackbar();

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IVolunteerAccountFormValues> = async (
    formValues
  ) => {
    try {
      await trigger({
        body: { passcode: formValues.passcodeCreate },
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

      handleResetPasscodeDialogClose();
      reset(defaultValues);
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
      handleDialogClose={() => {
        handleResetPasscodeDialogClose();
        reset(defaultValues);
      }}
      isDialogOpen={isResetPasscodeDialogOpen}
      text="Reset passcode"
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
          <ResetPasscodeForm
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
            onClick={() => {
              handleResetPasscodeDialogClose();
              reset(defaultValues);
            }}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
            }
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
            Reset passcode
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
