import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { Button, DialogActions } from "@mui/material";
import { useEffect } from "react";
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
  UseFormSetValue,
} from "react-hook-form";

import { IFormValues, ITimeAddValues } from "@/app/shifts/types/type";
import { ShiftTypesTimeDialogForm } from "@/app/shifts/types/type/ShiftTypesTimeDialogForm";
import { DialogContainer } from "@/components/general/DialogContainer";

interface IShiftTypesTimeDialogUpdateProps {
  clearErrors: UseFormClearErrors<IFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<IFormValues, any>;
  errors: FieldErrors<IFormValues>;
  getValues: UseFormGetValues<IFormValues>;
  handleDialogClose: () => void;
  handleTimeUpdate: (time: ITimeAddValues) => void;
  isDialogOpen: boolean;
  setError: UseFormSetError<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
  timeFields: FieldArrayWithId<IFormValues, "timeList", "id">[];
  timeItem: ITimeAddValues;
  timePositionListAddFields: FieldArrayWithId<
    IFormValues,
    "timeAdd.positionList",
    "id"
  >[];
}

export const ShiftTypesTimeDialogUpdate = ({
  clearErrors,
  control,
  errors,
  getValues,
  handleDialogClose,
  handleTimeUpdate,
  isDialogOpen,
  setError,
  setValue,
  timeFields,
  timeItem,
  timePositionListAddFields,
}: IShiftTypesTimeDialogUpdateProps) => {
  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    if (isDialogOpen) {
      setValue("timeAdd", timeItem);
    }
  }, [isDialogOpen, setValue, timeItem]);

  // render
  // ------------------------------------------------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogClose}
      isDialogOpen={isDialogOpen}
      text="Update time"
    >
      <ShiftTypesTimeDialogForm
        clearErrors={clearErrors}
        control={control}
        errors={errors}
        getValues={getValues}
        setError={setError}
        timePositionListAddFields={timePositionListAddFields}
      />
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
          disabled={Boolean(errors.timeAdd)}
          onClick={() => {
            if (getValues("timeAdd.date") === "") {
              setError("timeAdd.date", {
                type: "required",
                message: "Date is required",
              });
            }
            if (getValues("timeAdd.startTime") === "") {
              setError("timeAdd.startTime", {
                type: "required",
                message: "Start time is required",
              });
            }
            if (getValues("timeAdd.endTime") === "") {
              setError("timeAdd.endTime", {
                type: "required",
                message: "End time is required",
              });
            }
            if (getValues("timeAdd.instance") === "") {
              setError("timeAdd.instance", {
                type: "required",
                message: "Instance is required",
              });
            }
            timeFields.forEach((timeFieldItem) => {
              if (
                timeFieldItem.instance === getValues("timeAdd.instance") &&
                timeFieldItem.timeId !== getValues("timeAdd.timeId")
              ) {
                setError("timeAdd.instance", {
                  type: "required",
                  message: "Instance must be unique",
                });
              }
            });
            if (!errors.timeAdd) {
              handleTimeUpdate(getValues("timeAdd"));
              handleDialogClose();
            }
          }}
          startIcon={<EditIcon />}
          type="button"
          variant="contained"
        >
          Update time
        </Button>
      </DialogActions>
    </DialogContainer>
  );
};
