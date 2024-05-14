// general
// --------------------
export interface ISwitchValues {
  isCheckedIn: boolean;
  playaName: string;
  position: { name: string };
  shiftboardId: number;
  shiftPositionId: number;
  timeId: number;
  worldName: string;
}
export interface IReqSwitchValues {
  isCheckedIn: boolean;
  shiftboardId: number;
  shiftPositionId: number;
  timeId: number;
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

// shifts
// --------------------
export interface IResShiftItem {
  categoryId: number;
  date: string;
  dateName: string;
  departmentName: string;
  endTime: string;
  filledSlots: number;
  startTime: string;
  timeId: number;
  totalSlots: number;
  type: string;
  year: string;
}
export interface IResShiftPositionCountItem {
  filledSlots: number;
  positionName: string;
  positionDetails: string;
  positionId: number;
  prerequisiteId: number;
  roleRequiredId: number;
  shiftPositionId: number;
  totalSlots: number;
}
export interface IResShiftVolunteerItem {
  isCheckedIn: string;
  playaName: string;
  positionName: string;
  shiftboardId: number;
  shiftPositionId: number;
  timeId: number;
  worldName: string;
}
