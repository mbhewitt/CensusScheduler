// shifts
// --------------------
export interface IResShiftRowItem {
  category: {
    id: number;
  };
  date: string;
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
  year: string;
}
export interface IReqShiftVolunteerItem {
  id: number;
  noShow: string;
  shiftboardId: number;
  shiftPositionId: number | string;
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
  shiftPositionId: number;
  totalSlots: number;
}
export interface IResShiftVolunteerRowItem {
  isCheckedIn: string;
  playaName: string;
  positionName: string;
  shiftboardId: number;
  shiftPositionId: number;
  timeId: number;
  worldName: string;
}
export interface IResShiftVolunteerDetails {
  date: string;
  dateName: string;
  endTime: string;
  positionList: IResShiftPositionCountItem[];
  startTime: string;
  type: string;
  volunteerList: IResShiftVolunteerRowItem[];
}