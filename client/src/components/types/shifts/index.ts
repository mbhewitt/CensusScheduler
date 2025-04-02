// shifts
// ------------------------------------------------------------
export interface IResShiftRowItem {
  category: {
    id: number;
  };
  dateName: string;
  department: {
    name: string;
  };
  endTime: string;
  id: number;
  slotsFilled: number;
  slotsTotal: number;
  startTime: string;
  type: string;
}
export interface IReqShiftVolunteerItem {
  id: number;
  noShow: string;
  shiftboardId: number;
  timePositionId: number | string;
}

// details
// ------------------------------------------------------------
export interface IResShiftPositionCountItem {
  positionDetails: string;
  positionId: number;
  positionName: string;
  prerequisiteId: number;
  roleRequiredId: number;
  slotsFilled: number;
  slotsTotal: number;
  timePositionId: number;
}
export interface IResShiftVolunteerRowItem {
  isCheckedIn: string;
  notes: string;
  playaName: string;
  positionName: string;
  rating: number;
  shiftboardId: number;
  timePositionId: number;
  worldName: string;
}
export interface IResShiftVolunteerInformation {
  positionList: IResShiftPositionCountItem[];
  shift: {
    dateName: string;
    details: string;
    endTime: string;
    meal: string;
    notes: string;
    startTime: string;
    typeName: string;
  };
  volunteerList: IResShiftVolunteerRowItem[];
}
