import {
  HighlightOff as HighlightOffIcon,
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

import { DialogContainer } from "src/components/general/DialogContainer";
import { ErrorForm } from "src/components/general/ErrorForm";
import { SnackbarText } from "src/components/general/SnackbarText";
import { IVolunteerAccountFormValues } from "src/components/types";
import { ResetPasscodeForm } from "src/components/volunteers/account/ResetPasscodeForm";
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
  const { isMutating, trigger } = useSWRMutation(
    `/api/volunteers/${shiftboardId}?update=passcode`,
    fetcherTrigger
  );
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
  const [isPasscodeCreateVisible, setIsPasscodeCreateVisible] = useState(false);
  const [isPasscodeConfirmVisible, setIsPasscodeConfirmVisible] =
    useState(false);

  // handle form submission
  const onSubmit: SubmitHandler<IVolunteerAccountFormValues> = async (
    dataForm
  ) => {
    try {
      await trigger({
        body: { passcode: dataForm.passcodeCreate },
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

        {/* handle errors */}
        {Object.keys(errors).length > 0 && <ErrorForm errors={errors} />}

        <Stack spacing={2}>
          <ResetPasscodeForm
            control={control}
            errors={errors}
            getValues={getValues}
            isMutating={isMutating}
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
            startIcon={<HighlightOffIcon />}
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
