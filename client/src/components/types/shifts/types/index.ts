// defaults
// ------------------------------------------------------------
export interface IResShiftTypeDefaults {
  categoryList: IResShiftTypeCategoryItem[];
  positionList: IResShiftTypePositionItem[];
  typeList: IResShiftTypeRowItem[];
}
export interface IResShiftTypeCategoryItem {
  id: number;
  name: string;
}
export interface IResShiftTypeItem {
  id: number;
  name: string;
}

// row table
// ------------------------------------------------------------
export interface IResShiftTypeRowItem {
  category: { name: string };
  id: number;
  name: string;
}

// shift types
// ------------------------------------------------------------
export interface IResShiftTypeCurrent {
  information: IResShiftTypeInformation;
  positionList: IResShiftTypePositionItem[];
  timeList: IResShiftTypeTimeItem[];
}
export interface IResShiftTypeInformation {
  category: { name: string };
  details: string;
  isCore: boolean;
  isOffPlaya: boolean;
  name: string;
}
export interface IResShiftTypePositionItem {
  critical: boolean;
  details: string;
  endTimeOffset: string;
  lead: boolean;
  name: string;
  positionId: number; // "id" is already taken by useFieldArray
  prerequisite: string;
  role: string;
  startTimeOffset: string;
  slotsTotal?: string;
  wapPoints?: string;
}
export interface IResShiftTypeTimeItem {
  endTime: string;
  instance: string;
  meal: string;
  notes: string;
  positionList: {
    alias: string;
    name: string;
    positionId: number;
    sapPoints: number;
    slots: number;
    timePositionId: number;
  }[];
  startTime: string;
  timeId: number; // "id" is already taken by useFieldArray
}
export interface IReqShiftTypeItem {
  information: IReqShiftTypeInformation;
  timeList: IReqShiftTypeTimeItem[];
}
export interface IReqShiftTypeInformation {
  category: {
    id: number;
  };
  details: string;
  isCore: boolean;
  isOffPlaya: boolean;
  name: string;
}
export interface IReqShiftTypeTimePositionItem {
  alias: string;
  name: string;
  positionId: number; // "id" is already taken by useFieldArray
  sapPoints: number;
  slots: number;
  timePositionId: number;
}
export interface IReqShiftTypeTimeItem {
  endTime: string;
  instance: string;
  meal: string;
  notes: string;
  positionList: IReqShiftTypeTimePositionItem[];
  startTime: string;
  timeId: number; // "id" is already taken by useFieldArray
}

// positions
// ------------------------------------------------------------
export interface IResShiftTypeTimePositionItem {
  id: number;
  name: string;
}

// times
// ------------------------------------------------------------
export interface IResShiftTypePositionTimeItem {
  id: number;
  name: string;
}
