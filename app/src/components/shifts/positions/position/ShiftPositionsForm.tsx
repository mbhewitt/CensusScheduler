import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";

import type { IResShiftPositionDefaults } from "src/components/types/shifts/positions";
import { COLOR_BURNING_MAN_BROWN } from "src/constants";
import { ensure } from "src/utils/ensure";

export interface IFormValues {
  critical: boolean;
  details: string;
  endTimeOffset: number;
  id: number;
  lead: boolean;
  name: string;
  prerequisite: {
    name: string;
  };
  role: { name: string };
  startTimeOffset: number;
}
interface IShiftPositionsFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  dataDefaults: IResShiftPositionDefaults;
  errors: FieldErrors<IFormValues>;
  positionName: string;
}

// utilities
// --------------------
export const findList = (
  dataDefaults: IResShiftPositionDefaults,
  formValues: IFormValues
) => {
  const prerequisiteIdFound = formValues.prerequisite.name
    ? ensure(
        dataDefaults.prerequisiteList.find(({ name }: { name: string }) => {
          return name === formValues.prerequisite.name;
        })
      ).id
    : null;
  const roleIdFound = formValues.role.name
    ? ensure(
        dataDefaults.roleList.find(({ name }: { name: string }) => {
          return name === formValues.role.name;
        })
      ).id
    : null;

  return [prerequisiteIdFound, roleIdFound];
};

export const defaultValues: IFormValues = {
  critical: false,
  details: "",
  endTimeOffset: 0,
  id: 0,
  lead: false,
  name: "",
  prerequisite: {
    name: "",
  },
  role: { name: "" },
  startTimeOffset: 0,
};
export const ShiftPositionsForm = ({
  control,
  dataDefaults,
  errors,
  positionName,
}: IShiftPositionsFormProps) => {
  // render
  // --------------------
  return (
    <>
      <Box
        sx={{
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      error={Boolean(errors.name)}
                      fullWidth
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
                      positionNameAvailable: (value) => {
                        const isPositionNameAvailable =
                          value === positionName ||
                          dataDefaults.positionList.every(
                            ({ name }) => name !== value
                          );

                        return (
                          isPositionNameAvailable ||
                          `${value} position has been added already`
                        );
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormGroup row>
                  <Controller
                    control={control}
                    name="critical"
                    render={({ field: { value, ...field } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={value}
                            color="secondary"
                          />
                        }
                        label="Critical"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="lead"
                    render={({ field: { value, ...field } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={value}
                            color="secondary"
                          />
                        }
                        label="Lead"
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
              <Grid item xs={6}>
                <Controller
                  control={control}
                  name="role.name"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="to">Role</InputLabel>
                      <Select
                        {...field}
                        error={Boolean(errors.role?.name)}
                        label="Role"
                        labelId="role"
                      >
                        <MenuItem key={0} value="">
                          <em>None</em>
                        </MenuItem>
                        {dataDefaults.roleList.map(({ id, name }) => (
                          <MenuItem key={id} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  control={control}
                  name="prerequisite.name"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="to">Prerequisite</InputLabel>
                      <Select
                        {...field}
                        error={Boolean(errors.prerequisite?.name)}
                        label="Prerequisite"
                        labelId="prerequisite"
                      >
                        <MenuItem key={0} value="">
                          <em>None</em>
                        </MenuItem>
                        {dataDefaults.prerequisiteList.map(({ id, name }) => (
                          <MenuItem key={id} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  control={control}
                  name="startTimeOffset"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Start time offset"
                      variant="standard"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  control={control}
                  name="endTimeOffset"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="End time offset"
                      variant="standard"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  control={control}
                  name="details"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Details"
                      multiline
                      variant="standard"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      <Divider sx={{ borderColor: COLOR_BURNING_MAN_BROWN, mb: 3 }} />
    </>
  );
};
