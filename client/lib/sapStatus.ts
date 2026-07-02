// Shared SAP day-by-day requirements logic. Single source of truth for the
// volunteer info endpoint (volunteer-facing "earn your SAP" page) and the
// super-admin SAP page's people list. Pure helpers only — no DB — so both
// callers feed it the day-CSP map they already query.

// SAP day-by-day requirements keyed by arrival datename. Each entry is either a
// single datename, or an array meaning "any of these". EarlyThur/Fri/Man are
// equivalent to PreSun.
export const DAY_REQS: Record<string, (string | string[])[]> = {
  PreSun: ["PreMon", "PreTue", "PreWed", "PreThur", ["PreFri", "PreSat", "OpenSun"]],
  PreMon: ["PreTue", "PreWed", "PreThur", ["PreFri", "PreSat", "OpenSun"]],
  PreTue: ["PreWed", "PreThur", ["PreFri", "PreSat", "OpenSun"]],
  PreWed: ["PreThur", "PreFri", ["PreSat", "OpenSun"]],
  PreThur: ["PreFri", ["PreSat", "OpenSun"]],
  PreFri: [["PreSat", "OpenSun"]],
  PreSat: ["OpenSun"],
};
DAY_REQS["EarlyThur"] = DAY_REQS["PreSun"];
DAY_REQS["EarlyFri"] = DAY_REQS["PreSun"];
DAY_REQS["EarlyMan"] = DAY_REQS["PreSun"];

// Datenames before or on opening (eligible for a SAP). A post-opening arrival
// bypasses the SAP requirement.
export const PRE_OPEN_DATENAMES = [
  "EarlyThur",
  "EarlyFri",
  "EarlyMan",
  "PreSun",
  "PreMon",
  "PreTue",
  "PreWed",
  "PreThur",
  "PreFri",
  "PreSat",
];

export interface RequiredDay {
  datenames: string[];
  label: string;
  fulfilled: boolean;
}

// Build the day-by-day requirement list for an arrival day. A day is fulfilled
// when the volunteer earned >= 1 CSP that day — which inherently excludes
// 0-CSP shifts (they sum to 0 and never satisfy a day).
export function buildRequiredDays(
  arrivalDatename: string,
  dayCspMap: Record<string, number>,
): RequiredDay[] {
  const reqs = DAY_REQS[arrivalDatename] ?? [];
  return reqs.map((r) => {
    if (Array.isArray(r)) {
      const label = r.join(", ").replace(/, ([^,]+)$/, ", or $1");
      const fulfilled = r.some((d) => (dayCspMap[d] ?? 0) >= 1);
      return { datenames: r, label, fulfilled };
    }
    return {
      datenames: [r],
      label: r,
      fulfilled: (dayCspMap[r] ?? 0) >= 1,
    };
  });
}
