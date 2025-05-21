import { TextField } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { IResRoleRowItem } from "@/components/types/roles";

export interface IFormValues {
  name: string;
}
interface IRolesDialogFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  roleList: IResRoleRowItem[];
  roleName: string;
}

export const defaultValues: IFormValues = {
  name: "",
};
export const RolesDialogForm = ({
  control,
  errors,
  roleList,
  roleName,
}: IRolesDialogFormProps) => {
  // render
  // ------------------------------------------------------------
  return (
    <Controller
      control={control}
      name="name"
      render={({ field }) => (
        <TextField
          {...field}
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
            const isRoleNameAvailable =
              value === roleName ||
              roleList.every(({ name }) => name !== value);

            return (
              isRoleNameAvailable || `${value} role has been added already`
            );
          },
        },
      }}
    />
  );
};
