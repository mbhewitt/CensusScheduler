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
