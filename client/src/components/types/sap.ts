// Response shapes for the super-admin SAP management endpoints.

export interface ISapRequiredDay {
  datenames: string[];
  label: string;
  fulfilled: boolean;
}

export interface ISapAssignment {
  sapId: number;
  sapDate: string;
  status: "assigned" | "received";
  receivedVia: "download" | "email" | null;
}

export interface ISapPerson {
  kind: "volunteer" | "offbook";
  shiftboardId: number | null;
  email: string | null;
  name: string;
  isStaff: boolean;
  autoLabel: string;
  firstShiftDate: string | null;
  firstShiftDayname: string | null;
  autoSapDate: string | null;
  autoSapDayname: string | null;
  requiredDays: ISapRequiredDay[];
  missing: string[];
  totalCsp: number;
  cspFulfilled: boolean;
  assignment: ISapAssignment | null;
}

export interface ISapAvailableDate {
  date: string;
  dayname: string | null;
  count: number;
}

export interface IResSapPeople {
  burnYear: number | null;
  availableDates: ISapAvailableDate[];
  people: ISapPerson[];
}

export interface ISapPoolRow {
  sapId: number;
  sapDate: string;
  ticketId: string;
  disposition: "unassigned" | "assigned" | "received" | "burned";
  receivedVia: "download" | "email" | null;
  receivedAt: string | null;
  assignee: string | null;
  supersededBySapId: number | null;
}

export interface IResSapPool {
  burnYear: number | null;
  saps: ISapPoolRow[];
}
