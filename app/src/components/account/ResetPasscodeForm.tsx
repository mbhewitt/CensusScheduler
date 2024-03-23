import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { IconButton, Stack, TextField } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormGetValues,
} from "react-hook-form";

import type { IVolunteerAccountFormValues } from "src/components/types";

interface IResetPasscodeFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IVolunteerAccountFormValues, any>;
  errors: FieldErrors<IVolunteerAccountFormValues>;
  getValues: UseFormGetValues<IVolunteerAccountFormValues>;
  isPasscodeConfirmVisible: boolean;
  isPasscodeCreateVisible: boolean;
  setIsPasscodeConfirmVisible: Dispatch<SetStateAction<boolean>>;
  setIsPasscodeCreateVisible: Dispatch<SetStateAction<boolean>>;
}

export const ResetPasscodeForm = ({
  control,
  errors,
  getValues,
  isPasscodeConfirmVisible,
  isPasscodeCreateVisible,
  setIsPasscodeConfirmVisible,
  setIsPasscodeCreateVisible,
}: IResetPasscodeFormProps) => {
  // display
  // --------------------
  return (
    <>
      <Stack alignItems="center" direction="row">
        <Controller
          control={control}
          name="passcodeCreate"
          render={({ field }) => (
            <TextField
              {...field}
              error={Object.hasOwn(errors, "passcodeCreate")}
              fullWidth
              helperText={
                errors.passcodeCreate?.message || "Must be a 4-digit number"
              }
              label="Passcode / PIN"
              required
              type={isPasscodeCreateVisible ? "text" : "password"}
              variant="standard"
            />
          )}
          rules={{
            maxLength: {
              value: 4,
              message: "Passcode / PIN max length is 4",
            },
            minLength: {
              value: 4,
              message: "Passcode / PIN min length is 4",
            },
            pattern: {
              value: /\d{4}/,
              message: "Passcode / PIN must be a 4-digit number",
            },
            required: "Passcode / PIN is required",
          }}
        />
        <IconButton onClick={() => setIsPasscodeCreateVisible((prev) => !prev)}>
          {isPasscodeCreateVisible ? (
            <VisibilityOffIcon color="secondary" />
          ) : (
            <VisibilityIcon color="secondary" />
          )}
        </IconButton>
      </Stack>
      <Stack alignItems="center" direction="row">
        <Controller
          control={control}
          name="passcodeConfirm"
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              error={Object.hasOwn(errors, "passcodeConfirm")}
              helperText={errors.passcodeConfirm?.message}
              label="Confirm passcode / PIN"
              required
              type={isPasscodeConfirmVisible ? "text" : "password"}
              variant="standard"
            />
          )}
          rules={{
            required: "Confirm passcode / PIN is required",
            validate: (value) =>
              value === getValues("passcodeCreate") ||
              "Passcodes / PINs must match",
          }}
        />
        <IconButton
          onClick={() => setIsPasscodeConfirmVisible((prev) => !prev)}
        >
          {isPasscodeConfirmVisible ? (
            <VisibilityOffIcon color="secondary" />
          ) : (
            <VisibilityIcon color="secondary" />
          )}
        </IconButton>
      </Stack>
    </>
  );
};
