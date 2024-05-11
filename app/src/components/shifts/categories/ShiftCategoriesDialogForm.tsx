import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { IResShiftCategoryItem } from "src/components/types";

export interface IFormValues {
  departmentName: string;
  name: string;
}
interface IShiftCategoriesDialogFormProps {
  categoryList: IResShiftCategoryItem[];
  categoryName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
}

export const defaultValues: IFormValues = {
  departmentName: "",
  name: "",
};
export const ShiftCategoriesDialogForm = ({
  categoryList,
  categoryName,
  control,
  errors,
}: IShiftCategoriesDialogFormProps) => {
  // render
  // --------------------
  const departmentListDisplay = [
    ...new Set(categoryList.map(({ departmentName }) => departmentName)),
  ].sort();

  return (
    <Stack direction="row" gap={2}>
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
            categoryNameAvailable: (value) => {
              const isCategoryNameAvailable =
                value === categoryName ||
                categoryList.every(({ name }) => name !== value);

              return (
                isCategoryNameAvailable ||
                `${value} category has been added already`
              );
            },
          },
        }}
      />
      <Controller
        control={control}
        name="departmentName"
        render={({ field }) => (
          <FormControl fullWidth variant="standard">
            <InputLabel id="to">Department *</InputLabel>
            <Select
              {...field}
              error={Boolean(errors.departmentName)}
              label="Department"
              labelId="department"
              required
            >
              {departmentListDisplay.map((departmentName) => (
                <MenuItem key={departmentName} value={departmentName}>
                  {departmentName}
                </MenuItem>
              ))}
            </Select>
            {errors.departmentName && (
              <FormHelperText error>
                {errors.departmentName.message}
              </FormHelperText>
            )}
          </FormControl>
        )}
        rules={{
          required: "Department is required",
        }}
      />
    </Stack>
  );
};
