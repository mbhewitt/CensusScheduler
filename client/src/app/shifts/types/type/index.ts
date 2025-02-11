export interface IFormValues {
  information: {
    category: { name: string };
    details: string;
    isCore: boolean;
    isOffPlaya: boolean;
    name: string;
  };
  positionAdd: {
    alias: string;
    critical: boolean;
    details: string;
    endTimeOffset: string;
    lead: boolean;
    name: string;
    positionId: number;
    prerequisite: string;
    role: string;
    sapPoints: string;
    slots: string;
    startTimeOffset: string;
  };
  positionList: {
    critical: boolean;
    details: string;
    endTimeOffset: string;
    lead: boolean;
    name: string;
    positionId: number;
    prerequisite: string;
    role: string;
    startTimeOffset: string;
  }[];
  timeAdd: {
    date: string;
    endTime: string;
    instance: string;
    notes: string;
    positionList: {
      alias: string;
      name: string;
      positionId: number;
      sapPoints: string;
      slots: string;
    }[];
    startTime: string;
  };
  timeList: {
    endTime: string;
    date: string;
    instance: string;
    notes: string;
    positionList: {
      alias: string;
      name: string;
      positionId: number;
      sapPoints: string;
      slots: string;
      timePositionId: number;
    }[];
    startTime: string;
    timeId: number;
  }[];
}
export interface IPositionAddValues {
  alias: string;
  name: string;
  positionId: number;
  sapPoints: string;
  slots: string;
}
export interface ITimeAddValues {
  date: string;
  endTime: string;
  instance: string;
  notes: string;
  positionList: {
    alias: string;
    name: string;
    positionId: number;
    sapPoints: string;
    slots: string;
    timePositionId: number;
  }[];
  startTime: string;
}
