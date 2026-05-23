// Types for /api/training/confirmation/[code]. See specs/training-
// confirmation-endpoint.md.

export interface IResTrainingShiftItem {
  dateName: string;
  department: string;
  endTime: string;
  position: string;
  positionId: number;
  shiftName: string;
  shiftTimesId: number;
  startTime: string;
}

export interface IResTrainingConfirmation {
  training: {
    name: string;
    roleId: number;
    roleName: string;
    url: string;
  };
  volunteer: {
    playaName: string;
  };
  alreadyConfirmed: boolean;
  availableShifts: IResTrainingShiftItem[];
}

export interface IReqTrainingConfirm {
  shiftboardId: number;
}
