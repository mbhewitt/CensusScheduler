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

import type { IResShiftPositionItem } from "src/components/types";
import { COLOR_BURNING_MAN_BROWN } from "src/constants";

interface IDataDefaults {
  positionList: IResShiftPositionItem[];
  prerequisiteList: IResShiftPositionPrerequisiteItem[];
  roleList: IResShiftPositionRoleItem[];
}
export interface IFormValues {
  critical: boolean;
  endTimeOffset: number;
  lead: boolean;
  details: string;
  positionDetails: string;
  id: number;
  name: string;
  prerequisiteName: string;
  startTimeOffset: number;
  roleName: string;
}
interface IResShiftPositionPrerequisiteItem {
  id: number;
  name: string;
}
interface IResShiftPositionRoleItem {
  id: number;
  name: string;
}
interface IShiftPositionsFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  dataDefaults: IDataDefaults;
  errors: FieldErrors<IFormValues>;
  positionName: string;
}

// utilities
// --------------------
export const findList = (
  dataDefaults: IDataDefaults,
  formValues: IFormValues
) => {
  const prerequisiteFound = dataDefaults.prerequisiteList.find(
    ({ name }: { name: string }) => {
      return name === formValues.prerequisiteName;
    }
  );
  const roleFound = dataDefaults.roleList.find(({ name }: { name: string }) => {
    return name === formValues.roleName;
  });

  return [prerequisiteFound, roleFound];
};

export const defaultValues: IFormValues = {
  critical: false,
  endTimeOffset: 0,
  details: "",
  lead: false,
  positionDetails: "",
  id: 0,
  name: "",
  prerequisiteName: "",
  startTimeOffset: 0,
  roleName: "",
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
                  name="roleName"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="to">Role</InputLabel>
                      <Select
                        {...field}
                        error={Boolean(errors.roleName)}
                        label="Role"
                        labelId="role"
                      >
                        {dataDefaults.roleList.map(
                          ({ id, name }: IResShiftPositionRoleItem) => (
                            <MenuItem key={id} value={name}>
                              {name}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  control={control}
                  name="prerequisiteName"
                  render={({ field }) => (
                    <FormControl fullWidth variant="standard">
                      <InputLabel id="to">Prerequisite</InputLabel>
                      <Select
                        {...field}
                        error={Boolean(errors.prerequisiteName)}
                        label="Prerequisite"
                        labelId="prerequisite"
                        required
                      >
                        {dataDefaults.prerequisiteList.map(
                          ({ id, name }: IResShiftPositionPrerequisiteItem) => (
                            <MenuItem key={id} value={name}>
                              {name}
                            </MenuItem>
                          )
                        )}
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
