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
export interface IResVolunteerDefaultItem {
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
  dateName: string;
  department: { name: string };
  endTime: string;
  noShow: string;
  position: { name: string };
  timeId: number;
  timePositionId: number;
  startTime: string;
}
