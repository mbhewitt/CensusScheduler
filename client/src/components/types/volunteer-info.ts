// volunteer info (VIP)
// ------------------------------------------------------------

// request
export interface IReqVolunteerInfoUpdate {
  arrivalDateId?: number | null;
  location?: string;
}
export interface IReqToggleOtherSap {
  hasOtherSap: boolean;
}
export interface IReqToggleProfileUpdated {
  updated: boolean;
}

// response
export interface IResVolunteerInfo {
  volunteer: {
    shiftboardId: number;
    playaName: string;
    worldName: string;
    email: string;
    location: string;
  };
  arrivalDate: {
    dateId: number;
    datename: string;
    date: string;
  } | null;
  sapStatus: {
    bypass: boolean;
    bypassReason: "sap_issued" | "staff" | "other_sap" | "post_opening" | null;
    sapFile: {
      sapId: number;
      filename: string;
      datename: string;
      date: string;
    } | null;
    totalCsp: number;
    requiredCsp: number;
    cspFulfilled: boolean;
    requiredDays: {
      datenames: string[];
      label: string;
      fulfilled: boolean;
    }[];
  };
  roleThresholds: {
    role: string;
    requiredCsp: number;
    currentCsp: number;
    fulfilled: boolean;
  }[];
  trainings: {
    trainingId: number;
    trainingName: string;
    url: string;
    completed: boolean;
  }[];
  roles: string[];
  dates: {
    dateId: number;
    datename: string;
    date: string;
  }[];
  shifts: {
    datename: string;
    date: string;
    startTime: string;
    endTime: string;
    position: string;
    department: string;
    csp: number;
  }[];
  burnerProfileUpdated: boolean;
  behavioralStandardsSigned: boolean;
}
