export interface IPositionItem {
  details: string;
  freeSlots: number;
  position: string;
  role: string;
  shiftPositionId: string;
  totalSlots: number;
}
export interface IRoleVolunteerItem {
  playaName: string;
  roleName: string;
  shiftboardId: number;
  worldName: string;
}
export interface IShiftItem {
  category: string;
  date: string;
  dateName: string;
  freeSlots: number;
  shiftId: string;
  shift: string;
  shortName: string;
  totalSlots: number;
  year: number;
}
export interface IShiftPositionListItem {
  date: string;
  dateName: string;
  endTime: string;
  freeSlots: number;
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
  shiftPositionId: string;
  worldName: string;
}
export interface ITrainingItem {
  date: string;
  dateName: string;
  endTime: string;
  freeSlots: number;
  position: string;
  shift: string;
  shiftPositionId: string;
  startTime: string;
  totalSlots: number;
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
