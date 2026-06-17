// shifts
// ------------------------------------------------------------
export interface IResShiftRowItem {
  canceled: boolean;
  category: {
    id: number;
  };
  // Min / max sap_points across the shift's positions. Equal when every
  // position pays the same; different otherwise (UI renders a range).
  cspMin: number;
  cspMax: number;
  date: string;
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
  // sap_points for the position; surfaced in the positions table on
  // /shifts/[timeId]/volunteers and used wherever CSP per position is shown.
  csp: number;
  // Config-driven signup-rule knobs (migration 006). null = no rule.
  // maxPerVolunteer: most signups one volunteer should hold for this position
  // across all shifts; minScheduledCsp: CSP they must already have scheduled to
  // take it. The signup dialog warns (allow-proceed) when over/under.
  maxPerVolunteer: number | null;
  minScheduledCsp: number | null;
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
    canceled: boolean;
    date: string;
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
