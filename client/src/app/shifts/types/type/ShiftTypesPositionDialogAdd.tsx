import {
  Close as CloseIcon,
  GroupAdd as GroupAddIcon,
} from "@mui/icons-material";
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContentText,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetValue,
} from "react-hook-form";

import { IFormValues, IPositionAddValues } from "@/app/shifts/types/type";
import { DialogContainer } from "@/components/general/DialogContainer";
import type { IResShiftTypePositionItem } from "@/components/types/shifts/types";

interface IShiftTypesPositionDialogAddProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  getValues: UseFormGetValues<IFormValues>;
  handleDialogClose: () => void;
  handlePositionAdd: (position: IPositionAddValues) => void;
  isDialogOpen: boolean;
  positionListDefaults: IResShiftTypePositionItem[];
  setError: UseFormSetError<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
}

export const ShiftTypesPositionDialogAdd = ({
  control,
  errors,
  getValues,
  handleDialogClose,
  handlePositionAdd,
  isDialogOpen,
  positionListDefaults,
  setError,
  setValue,
}: IShiftTypesPositionDialogAddProps) => {
  // render
  // --------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
      text="Add position"
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <DialogContentText>
            <Typography component="span">
              Position will be added to all shift times.
            </Typography>
          </DialogContentText>
        </Grid>
        <Grid size={6}>
          <Controller
            control={control}
            name="positionAdd.name"
            render={({ field }) => (
              <FormControl fullWidth variant="standard">
                <InputLabel id="position">Position *</InputLabel>
                <Select
                  {...field}
                  error={Boolean(errors.positionAdd?.name)}
                  label="Position *"
                  labelId="position"
                  onChange={(event) => {
                    const positionSelected = event.target.value;
                    const positionFound = positionListDefaults.find(
                      ({ name }) => {
                        return name === positionSelected;
                      }
                    );

                    // update field
                    field.onChange(positionSelected);

                    if (positionFound) {
                      // auto-populate fields
                      setValue("positionAdd.critical", positionFound.critical);
                      setValue("positionAdd.details", positionFound.details);
                      setValue(
                        "positionAdd.endTimeOffset",
                        positionFound.endTimeOffset
                      );
                      setValue("positionAdd.lead", positionFound.lead);
                      setValue(
                        "positionAdd.prerequisite",
                        positionFound.prerequisite
                      );
                      setValue("positionAdd.role", positionFound.role);
                      setValue(
                        "positionAdd.startTimeOffset",
                        positionFound.startTimeOffset
                      );
                      setValue("positionAdd.alias", positionFound.name);
                    }
                  }}
                  required
                >
                  {positionListDefaults.map(({ positionId, name }) => {
                    return (
                      <MenuItem key={positionId} value={name}>
                        {name}
                      </MenuItem>
                    );
                  })}
                </Select>
                {Boolean(errors.positionAdd?.name) && (
                  <FormHelperText error>
                    {errors.positionAdd?.name?.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
            rules={{
              required: "Position is required",
            }}
          />
        </Grid>
        <Grid size={6}>
          <FormGroup row>
            <Controller
              control={control}
              name="positionAdd.critical"
              render={({ field: { value, ...field } }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={value}
                      color="secondary"
                      disabled
                    />
                  }
                  label="Critical"
                />
              )}
            />
            <Controller
              control={control}
              name="positionAdd.lead"
              render={({ field: { value, ...field } }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={value}
                      color="secondary"
                      disabled
                    />
                  }
                  label="Lead"
                />
              )}
            />
          </FormGroup>
        </Grid>
        <Grid size={6}>
          <Controller
            control={control}
            name="positionAdd.role"
            render={({ field }) => (
              <TextField
                {...field}
                disabled
                fullWidth
                label="Role"
                variant="standard"
              />
            )}
          />
        </Grid>
        <Grid size={6}>
          <Controller
            control={control}
            name="positionAdd.prerequisite"
            render={({ field }) => (
              <TextField
                {...field}
                disabled
                fullWidth
                label="Prerequisite"
                variant="standard"
              />
            )}
          />
        </Grid>
        <Grid size={6}>
          <Controller
            control={control}
            name="positionAdd.startTimeOffset"
            render={({ field }) => (
              <TextField
                {...field}
                disabled
                fullWidth
                label="Start time offset (min)"
                variant="standard"
              />
            )}
          />
        </Grid>
        <Grid size={6}>
          <Controller
            control={control}
            name="positionAdd.endTimeOffset"
            render={({ field }) => (
              <TextField
                {...field}
                disabled
                fullWidth
                label="End time offset (min)"
                variant="standard"
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            control={control}
            name="positionAdd.details"
            render={({ field }) => (
              <TextField
                {...field}
                disabled
                fullWidth
                label="Details"
                variant="standard"
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <DialogContentText>
            <Typography component="span">
              Fields below will apply to all existing times, and they each can
              be customized.
            </Typography>
          </DialogContentText>
        </Grid>
        <Grid size={6}>
          <Controller
            control={control}
            name="positionAdd.alias"
            render={({ field }) => (
              <TextField
                {...field}
                error={Boolean(errors.positionAdd?.alias)}
                fullWidth
                helperText={errors.positionAdd?.alias?.message}
                label="Alias"
                required
                variant="standard"
              />
            )}
          />
        </Grid>
        <Grid size={3}>
          <Controller
            control={control}
            name="positionAdd.slots"
            render={({ field }) => (
              <TextField
                {...field}
                error={Boolean(errors.positionAdd?.slots)}
                fullWidth
                helperText={errors.positionAdd?.slots?.message}
                label="Slots"
                required
                type="number"
                variant="standard"
              />
            )}
            rules={{
              required: "Slots is required",
            }}
          />
        </Grid>
        <Grid size={3}>
          <Controller
            control={control}
            name="positionAdd.sapPoints"
            render={({ field }) => (
              <TextField
                {...field}
                error={Boolean(errors.positionAdd?.sapPoints)}
                fullWidth
                helperText={errors.positionAdd?.sapPoints?.message}
                label="SAP points"
                required
                type="number"
                variant="standard"
              />
            )}
            rules={{
              required: "SAP points is required",
            }}
          />
        </Grid>
      </Grid>
      <DialogActions>
        <Button
          startIcon={<CloseIcon />}
          onClick={handleDialogClose}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disabled={Boolean(errors.positionAdd)}
          onClick={() => {
            if (getValues("positionAdd.name") === "") {
              setError("positionAdd.name", {
                type: "required",
                message: "Position is required",
              });
            }
            if (getValues("positionAdd.alias") === "") {
              setError("positionAdd.alias", {
                type: "required",
                message: "Alias is required",
              });
            }
            if (!errors.positionAdd) {
              const positionFound = positionListDefaults.find(({ name }) => {
                return name === getValues("positionAdd.name");
              });

              handlePositionAdd({
                alias: getValues("positionAdd.alias"),
                name: getValues("positionAdd.name"),
                positionId: Number(positionFound?.positionId),
                sapPoints: Number(getValues("positionAdd.sapPoints")),
                slots: Number(getValues("positionAdd.slots")),
              });
              handleDialogClose();
            }
          }}
          startIcon={<GroupAddIcon />}
          type="button"
          variant="contained"
        >
          Add position
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
