export interface IPositionItem {
  filledSlots: number;
  position: string;
  positionDetails: string;
  positionTypeId: number;
  prerequisiteId: number;
  roleRequiredId: number;
  shiftPositionId: number;
  totalSlots: number;
}
export interface IRoleItem {
  display: boolean;
  roleId: number;
  roleName: string;
}
export interface IRoleVolunteerItem {
  playaName: string;
  roleId: number;
  roleName: string;
  shiftboardId: number;
  worldName: string;
}
export interface IShiftItem {
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
export interface IShiftPositionListItem {
  date: string;
  dateName: string;
  endTime: string;
  filledSlots: number;
  positionList: IPositionItem[];
  shift: string;
  shiftId: string;
  shortName: string;
  startTime: string;
  totalSlots: number;
}
export interface IShiftVolunteerItem {
  noShow: string;
  playaName: string;
  position: string;
  shiftboardId: number;
  shiftPositionId: number;
  shiftTimesId: number;
  worldName: string;
}
export interface IVolunteerItem {
  email: string;
  phone: string;
  playaName: string;
  shiftboardId: number | string;
  worldName: string;
}
export interface IVolunteerShiftItem {
  date: string;
  dateName: string;
  endTime: string;
  noShow: string;
  position: string;
  shift: string;
  shiftId: string;
  shiftPositionId: string;
  startTime: string;
}
export interface IVolunteerShiftCountItem {
  attendedCount: number;
  isNotes: boolean;
  noShowCount: number;
  playaName: string;
  remainingCount: number;
  shiftboardId: string;
  worldName: string;
}
export interface IVolunteerAccountFormValues {
  email?: string;
  emergencyContact?: string;
  location?: string;
  passcodeConfirm: string;
  passcodeCreate: string;
  phone?: string;
  playaName?: string;
  worldName?: string;
}
export type TCheckInTypes = "shiftFuture" | "shiftDuring" | "shiftPast";
export type TAccountActions =
  | "accountTypeAdmin"
  | "accountTypeAuthenticated"
  | "accountTypeUnauthenticated";
