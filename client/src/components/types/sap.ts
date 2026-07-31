// Response shapes for the super-admin SAP management endpoints.

export interface ISapRequiredDay {
  datenames: string[];
  label: string;
  fulfilled: boolean;
}

export interface ISapAssignment {
  sapId: number;
  sapDate: string;
  ticketId: string | null;
  status: "assigned" | "received";
  receivedVia: "download" | "email" | null;
}

export type ISapStanding = "external" | "not_earning" | "missing" | "complete";

export interface ISapPerson {
  kind: "volunteer" | "offbook";
  shiftboardId: number | null;
  email: string | null;
  name: string;
  worldName: string | null;
  isStaff: boolean;
  autoLabel: string;
  firstShiftDate: string | null;
  firstShiftDayname: string | null;
  autoSapDate: string | null;
  autoSapDayname: string | null;
  requiredDays: ISapRequiredDay[];
  standing: ISapStanding | null; // null for off-book (no requirements tracked)
  missingSummary: string[];
  missingDetail: string[];
  totalCsp: number;
  dateOverride: string | null; // persisted SAP-date dropdown choice (null = Auto)
  notes: string | null; // super-admin free-text note (exceptions), SAP page only
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
