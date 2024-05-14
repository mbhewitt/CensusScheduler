// passcode
// --------------------
export interface IReqPasscode {
  passcode: string;
}

// volunteers
// --------------------
export interface IReqVolunteerAccount {
  email: string;
  emergencyContact: string;
  location: string;
  notes: string;
  phone: string;
  playaName: string;
  worldName: string;
}
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

// volunteer shifts
// --------------------
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
  department: { name: string };
  endTime: string;
  noShow: string;
  position: { name: string };
  shiftPositionId: number;
  timeId: number;
  startTime: string;
}
