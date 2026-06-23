// passcode
// ------------------------------------------------------------
export interface IReqPasscode {
  passcode: string;
}

// volunteers
// ------------------------------------------------------------
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
// ------------------------------------------------------------
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
  department: {
    name: string;
  };
  shift: {
    canceled: boolean;
    // csp = sap_points for this signup; positionId = op_position_type id.
    // Used by the add dialog to total a volunteer's scheduled CSP and count
    // how many of a given position they hold (signup-rule warnings, #436/#429).
    csp: number;
    date: string;
    dateName: string;
    endTime: string;
    positionId: number;
    positionName: string;
    startTime: string;
    timeId: number;
    timePositionId: number;
  };
  volunteer: {
    noShow: string;
    notes: string;
    rating: null | number;
  };
}
