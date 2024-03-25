export interface IResPositionItem {
  filledSlots: number;
  positionName: string;
  positionDetails: string;
  positionTypeId: number;
  prerequisiteId: number;
  roleRequiredId: number;
  shiftPositionId: number;
  totalSlots: number;
}
export interface IResRoleItem {
  display: boolean;
  roleId: number;
  roleName: string;
}
export interface IResRoleVolunteerItem {
  playaName: string;
  roleId: number;
  roleName: string;
  shiftboardId: number;
  worldName: string;
}
export interface IResShiftItem {
  category: string;
  date: string;
  dateName: string;
  endTime: string;
  filledSlots: number;
  shiftCategoryId: number;
  shiftName: string;
  shiftTimesId: number;
  startTime: string;
  totalSlots: number;
  year: string;
}
export interface IResShiftVolunteerItem {
  noShow: string;
  playaName: string;
  positionName: string;
  shiftboardId: number;
  shiftPositionId: number;
  shiftTimesId: number;
  worldName: string;
}
export interface IResVolunteerAccount {
  email: string;
  emergencyContact: string;
  isVolunteerCreated: boolean;
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
  roleId: number;
  roleName: string;
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
  category: string;
  date: string;
  dateName: string;
  endTime: string;
  noShow: string;
  positionName: string;
  shiftPositionId: number;
  shiftTimesId: number;
  startTime: string;
}
export interface ISwitchValues {
  checked: boolean;
  playaName: string;
  positionName: string;
  shiftboardId: number;
  shiftPositionId: number;
  shiftTimesId: number;
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
