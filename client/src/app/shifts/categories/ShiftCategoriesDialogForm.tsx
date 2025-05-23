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

import { IResShiftCategoryItem } from "@/components/types/shifts/categories";

export interface IFormValues {
  department: { name: string };
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
  department: { name: "" },
  name: "",
};
export const ShiftCategoriesDialogForm = ({
  categoryList,
  categoryName,
  control,
  errors,
}: IShiftCategoriesDialogFormProps) => {
  // render
  // ------------------------------------------------------------
  const departmentListDisplay = [
    ...new Set(categoryList.map(({ department: { name } }) => name)),
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
        name="department.name"
        render={({ field }) => (
          <FormControl fullWidth required variant="standard">
            <InputLabel id="department">Department</InputLabel>
            <Select
              {...field}
              error={Boolean(errors.department?.name)}
              label="Department *"
              labelId="department"
            >
              {departmentListDisplay.map((departmentName) => (
                <MenuItem key={departmentName} value={departmentName}>
                  {departmentName}
                </MenuItem>
              ))}
            </Select>
            {errors.department?.name && (
              <FormHelperText error>
                {errors.department.name.message}
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
