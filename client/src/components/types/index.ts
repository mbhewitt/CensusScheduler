// general
// ------------------------------------------------------------
export interface ICheckboxValues {
  shift: {
    positionName: string;
    timePositionId: number;
  };
  volunteer: {
    isCheckedIn: boolean;
    playaName: string;
    shiftboardId: number;
    worldName: string;
  };
}
export interface IReqReviewValues {
  notes: string;
  rating: number;
  shiftboardId: number;
  timePositionId: number;
  updateType: string;
}
export interface IReqCheckboxValues {
  isCheckedIn: boolean;
  shiftboardId: number;
  timePositionId: number;
  updateType: string;
}
export interface IVolunteerOption {
  label: string;
  shiftboardId: number;
}
export interface IVolunteerAccountFormValues {
  email?: string;
  emergencyContact?: string;
  location?: string;
  passcodeConfirm?: string;
  passcodeCreate?: string;
  phone?: string;
  playaName?: string;
  worldName?: string;
}
export type TCheckInTypes = "shiftFuture" | "shiftDuring" | "shiftPast";
export type TAccountActions =
  | "accountTypeAdmin"
  | "accountTypeAuthenticated"
  | "accountTypeUnauthenticated";
