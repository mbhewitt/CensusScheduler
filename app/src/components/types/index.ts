// general
// --------------------
export interface ISwitchValues {
  checked: boolean;
  playaName: string;
  positionName: string;
  shiftboardId: number;
  shiftPositionId: number;
  timeId: number;
  worldName: string;
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
  noShow: string;
  playaName: string;
  positionName: string;
  shiftboardId: number;
  shiftPositionId: number;
  timeId: number;
  worldName: string;
}

// volunteers
// --------------------
export interface IResVolunteerAccount {
  email: string;
  emergencyContact: string;
  isCreated: boolean;
  location: string;
  notes: string;
  phone: string;
  playaName: string;
  roleList: IResVolunteerRoleItem[];
  shiftboardId: number;
  worldName: string;
}
export interface IResVolunteerDropdownItem {
  playaName: string;
  roleList: IResVolunteerRoleItem[];
  shiftboardId: number;
  worldName: string;
}
export interface IResVolunteerRoleItem {
  id: number;
  name: string;
}
export interface IResVolunteerShiftCountItem {
  attendedCount: number;
  isNotes: boolean;
  noShowCount: number;
  playaName: string;
  remainingCount: number;
  shiftboardId: string;
  worldName: string;
}
export interface IResVolunteerShiftItem {
  date: string;
  dateName: string;
  departmentName: string;
  endTime: string;
  noShow: string;
  positionName: string;
  shiftPositionId: number;
  timeId: number;
  startTime: string;
}
