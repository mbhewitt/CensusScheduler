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
  category: string;
  name: string;
}
interface IShiftCategoriesDialogFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  shiftCategoryName: string;
  shiftCategoryList: IResShiftCategoryItem[];
}

export const defaultValues: IFormValues = {
  category: "",
  name: "",
};
export const ShiftCategoriesDialogForm = ({
  control,
  errors,
  shiftCategoryName,
  shiftCategoryList,
}: IShiftCategoriesDialogFormProps) => {
  // render
  // --------------------
  const shiftCategoryListDisplay = [
    ...new Set(shiftCategoryList.map(({ category }) => category)),
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
            shiftCategoryNameAvailable: (value) => {
              const isShiftCategoryNameAvailable =
                value === shiftCategoryName ||
                shiftCategoryList.every(({ name }) => name !== value);

              return (
                isShiftCategoryNameAvailable ||
                `${value} shift category has been added already`
              );
            },
          },
        }}
      />
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <FormControl fullWidth variant="standard">
            <InputLabel id="to">Category *</InputLabel>
            <Select
              {...field}
              error={Boolean(errors.category)}
              label="Category"
              labelId="category"
              required
            >
              {shiftCategoryListDisplay.map((shiftCategoryItem) => (
                <MenuItem key={shiftCategoryItem} value={shiftCategoryItem}>
                  {shiftCategoryItem}
                </MenuItem>
              ))}
            </Select>
            {errors.category && (
              <FormHelperText error>{errors.category.message}</FormHelperText>
            )}
          </FormControl>
        )}
        rules={{
          required: "Category is required",
        }}
      />
    </Stack>
  );
};
