import { TextField } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { IResRoleItem } from "src/components/types";

export interface IFormValues {
  name: string;
}
interface IRolesDialogFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  roleList: IResRoleItem[];
}

export const defaultValues: IFormValues = {
  name: "",
};
export const RolesDialogForm = ({
  control,
  errors,
  roleList,
}: IRolesDialogFormProps) => {
  // display
  // --------------------
  return (
    <Controller
      control={control}
      name="name"
      render={({ field }) => (
        <TextField
          {...field}
          autoComplete="off"
          fullWidth
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          label="Name"
          required
          variant="standard"
        />
      )}
      rules={{
        required: "Name is required",
        validate: {
          required: (value) => {
            return Boolean(value.trim()) || "Name is required";
          },
          roleNameAvailable: (value) => {
            const isRoleNameAvailable = roleList.every(
              ({ roleName }) => roleName.toLowerCase() !== value.toLowerCase()
            );

            return (
              isRoleNameAvailable || `${value} role has been added already`
            );
          },
        },
      }}
    />
  );
};
