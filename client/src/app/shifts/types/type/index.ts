export interface IPositionAddValues {
  alias: string;
  critical: boolean;
  details: string;
  endTimeOffset: string;
  lead: boolean;
  name: string;
  positionId: number;
  prerequisite: string;
  role: string;
  sapPoints: number;
  slots: number;
  startTimeOffset: string;
}
export interface ITimeAddValues {
  date: string;
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
  timeId: number;
}
export interface IFormValues {
  information: {
    category: { name: string };
    details: string;
    isCore: boolean;
    isOffPlaya: boolean;
    name: string;
  };
  positionAdd: IPositionAddValues;
  positionList: IPositionAddValues[];
  timeAdd: ITimeAddValues;
  timeList: ITimeAddValues[];
}
