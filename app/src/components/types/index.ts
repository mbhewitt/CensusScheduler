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

// roles
// --------------------
export interface IResRoleItem {
  display: boolean;
  id: number;
  name: string;
}
export interface IResRoleVolunteerItem {
  playaName: string;
  shiftboardId: number;
  worldName: string;
}

// shift categories
// --------------------
export interface IResShiftCategoryItem {
  category: string;
  id: number;
  name: string;
}

// shift types
// --------------------
export interface IResShiftTypeCategoryItem {
  id: number;
  name: string;
}
export interface IResShiftTypeInformation {
  category: string;
  details: string;
  isCore: boolean;
  isOffPlaya: boolean;
  name: string;
}
export interface IResShiftTypeItem {
  id: number;
  name: string;
}
export interface IResShiftTypePositionItem {
  critical: boolean;
  details: string;
  endTimeOffset: string;
  lead: boolean;
  name: string;
  positionId: number;
  prerequisiteShift: string;
  role: string;
  startTimeOffset: string;
}
export interface IResShiftTypeTimeItem {
  date: string;
  endTime: string;
  instance: string;
  notes: string;
  startTime: string;
  timeId: number;
}
export interface IReqShiftTypeInfoItem extends IResShiftTypeInformation {
  categoryId: string;
}
export interface IReqShiftTypePositionItem extends IResShiftTypePositionItem {
  totalSlots: string;
  wapPoints: string;
}

// shifts
// --------------------
export interface IResShiftItem {
  category: string;
  categoryId: number;
  date: string;
  dateName: string;
  endTime: string;
  filledSlots: number;
  startTime: string;
  timeId: number;
  totalSlots: number;
  type: string;
  year: string;
}
export interface IResShiftPositionItem {
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
  category: string;
  date: string;
  dateName: string;
  endTime: string;
  noShow: string;
  positionName: string;
  shiftPositionId: number;
  timeId: number;
  startTime: string;
}
