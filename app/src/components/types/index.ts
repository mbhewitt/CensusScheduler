export interface IDataPositionItem {
  details: string;
  freeSlots: number;
  position: string;
  role: string;
  shiftPositionId: string;
  totalSlots: number;
}
export interface IDataShiftItem {
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
export interface IDataShiftPositionListItem {
  date: string;
  dateName: string;
  endTime: string;
  freeSlots: number;
  positionList: IDataPositionItem[];
  shift: string;
  shiftId: string;
  shortName: string;
  startTime: string;
  totalSlots: number;
}
export interface IDataShiftVolunteerItem {
  noShow: string;
  playaName: string;
  position: string;
  shiftboardId: number;
  shiftPositionId: string;
  worldName: string;
}
export interface IDataTrainingItem {
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
export interface IDataVolunteerItem {
  email: string;
  phone: string;
  playaName: string;
  shiftboardId: number | string;
  worldName: string;
}
export interface IDataVolunteerShiftItem {
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
export interface IDataVolunteerShiftCountItem {
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
