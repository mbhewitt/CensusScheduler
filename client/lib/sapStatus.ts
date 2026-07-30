// Shared SAP eligibility logic. Single source of truth for the volunteer info
// endpoint (volunteer-facing "earn your SAP" page) and the super-admin SAP
// page's people list — parity by design: both pages MUST evaluate eligibility
// through evaluateSapEligibility below, never with their own rules. Pure
// helpers only — no DB — so both callers feed it the data they already query.

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

// SAP-related role ids (op_roles), shared by both endpoints.
export const ROLE_STAFF_ID = 2000006;
export const ROLE_OTHER_SAP_ID = 2000007;

export const REQUIRED_CSP = 12;

export interface RequiredDay {
  datenames: string[];
  label: string;
  fulfilled: boolean;
}

// Where a person stands on getting a SAP:
// - external: getting a SAP from another group (role 2000007) — not ours to earn
// - not_earning: no SAP-earning shift signed up (and not staff), so currently
//   not on track to get one
// - missing: on track but requirements outstanding
// - complete: all requirements met
export type SapStanding = "external" | "not_earning" | "missing" | "complete";

export interface SapEligibilityInput {
  isStaff: boolean;
  hasExternalSap: boolean;
  bsSigned: boolean;
  missingTrainings: string[]; // names of required-but-uncompleted trainings
  totalCsp: number;
  requiredDays: RequiredDay[];
  hasEligibleShift: boolean; // has at least one CSP-earning shift
}

export interface SapEligibility {
  standing: SapStanding;
  requirementsMet: boolean;
  missingSummary: string[]; // compact, e.g. ["BS", "2 trainings", "4 CSP", "1 day"]
  missingDetail: string[]; // full labels for tooltips
}

// The one place SAP requirements are defined: signed Behavioral Standards,
// every position-required training completed, >= REQUIRED_CSP points, and
// each required work day covered.
export function evaluateSapEligibility(
  input: SapEligibilityInput,
): SapEligibility {
  const missingDays = input.requiredDays.filter((d) => !d.fulfilled);
  const cspShort = Math.max(0, REQUIRED_CSP - input.totalCsp);

  const missingSummary: string[] = [];
  const missingDetail: string[] = [];
  if (!input.bsSigned) {
    missingSummary.push("BS");
    missingDetail.push("Sign Behavioral Standards");
  }
  if (input.missingTrainings.length > 0) {
    missingSummary.push(
      `${input.missingTrainings.length} training${
        input.missingTrainings.length > 1 ? "s" : ""
      }`,
    );
    missingDetail.push(...input.missingTrainings.map((t) => `${t} training`));
  }
  if (cspShort > 0) {
    missingSummary.push(`${cspShort} CSP`);
    missingDetail.push(`CSP ${input.totalCsp}/${REQUIRED_CSP}`);
  }
  if (missingDays.length > 0) {
    missingSummary.push(
      `${missingDays.length} day${missingDays.length > 1 ? "s" : ""}`,
    );
    missingDetail.push(...missingDays.map((d) => d.label));
  }

  const requirementsMet = missingSummary.length === 0;

  const standing: SapStanding = input.hasExternalSap
    ? "external"
    : !input.hasEligibleShift && !input.isStaff
      ? "not_earning"
      : requirementsMet
        ? "complete"
        : "missing";

  return { standing, requirementsMet, missingSummary, missingDetail };
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
