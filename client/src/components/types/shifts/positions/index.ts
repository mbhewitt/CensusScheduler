// details
// ------------------------------------------------------------
export interface IReqShiftPositionItem {
  critical: boolean;
  details: string;
  endTimeOffset: number;
  lead: boolean;
  name: string;
  prerequisite: {
    id: number;
  };
  role: {
    id: number;
  };
  startTimeOffset: number;
}
export interface IResShiftPositionItem {
  critical: boolean;
  details: string;
  endTimeOffset: number;
  lead: boolean;
  name: string;
  prerequisite: {
    name: string;
  };
  role: {
    name: string;
  };
  startTimeOffset: number;
}

// detaults
// ------------------------------------------------------------
export interface IResShiftPositionDefaults {
  positionList: IResShiftPositionRowItem[];
  prerequisiteList: IResShiftPositionPrerequisiteItem[];
  roleList: IResShiftPositionRoleItem[];
}
export interface IResShiftPositionPrerequisiteItem {
  id: number;
  name: string;
}
export interface IResShiftPositionRoleItem {
  id: number;
  name: string;
}

// row table
// ------------------------------------------------------------
export interface IResShiftPositionRowItem {
  id: number;
  name: string;
}

// types
// ------------------------------------------------------------
export interface IResShiftPositionTypeItem {
  id: number;
  name: string;
}
