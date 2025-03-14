// shifts
// --------------------
export interface IResShiftRowItem {
  category: {
    id: number;
  };
  dateName: string;
  department: {
    name: string;
  };
  endTime: string;
  filledSlots: number;
  id: number;
  startTime: string;
  totalSlots: number;
  type: string;
}
export interface IReqShiftVolunteerItem {
  id: number;
  noShow: string;
  shiftboardId: number;
  timePositionId: number | string;
}

// details
// --------------------
export interface IResShiftPositionCountItem {
  filledSlots: number;
  positionName: string;
  positionDetails: string;
  positionId: number;
  prerequisiteId: number;
  roleRequiredId: number;
  timePositionId: number;
  totalSlots: number;
}
export interface IResShiftVolunteerRowItem {
  isCheckedIn: string;
  playaName: string;
  positionName: string;
  shiftboardId: number;
  timeId: number;
  timePositionId: number;
  worldName: string;
}
export interface IResShiftVolunteerInformation {
  dateName: string;
  details: string;
  endTime: string;
  meal: string;
  notes: string;
  positionList: IResShiftPositionCountItem[];
  startTime: string;
  type: string;
  volunteerList: IResShiftVolunteerRowItem[];
}
