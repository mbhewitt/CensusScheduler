import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateSapEligibility,
  isPreOpenShift,
  REQUIRED_CSP,
} from "../../lib/sapStatus";

const day = (label: string, fulfilled: boolean) => ({
  datenames: [label],
  label,
  fulfilled,
});

const base = {
  isStaff: false,
  hasExternalSap: false,
  bsSigned: true,
  missingTrainings: [] as string[],
  totalCsp: REQUIRED_CSP,
  requiredDays: [day("PreThur", true)],
  hasPreOpenShift: true,
  hasDateOverride: false,
};

test("complete when everything is met", () => {
  const e = evaluateSapEligibility(base);
  assert.equal(e.standing, "complete");
  assert.equal(e.requirementsMet, true);
  assert.deepEqual(e.missingSummary, []);
});

test("summary lists BS, trainings, CSP shortfall, days — in that order", () => {
  const e = evaluateSapEligibility({
    ...base,
    bsSigned: false,
    missingTrainings: ["Census Basics", "Random Sampling"],
    totalCsp: 8,
    requiredDays: [day("PreThur", false), day("PreFri", true)],
  });
  assert.equal(e.standing, "missing");
  assert.deepEqual(e.missingSummary, ["BS", "2 trainings", "4 CSP", "1 day"]);
  assert.deepEqual(e.missingDetail, [
    "Sign Behavioral Standards",
    "Census Basics training",
    "Random Sampling training",
    "CSP 8/12",
    "PreThur",
  ]);
});

test("external SAP wins over everything else", () => {
  const e = evaluateSapEligibility({
    ...base,
    hasExternalSap: true,
    bsSigned: false,
    hasPreOpenShift: false,
  });
  assert.equal(e.standing, "external");
});

test("no pre-open shift or Staff -> not_earning, unless a date is set", () => {
  assert.equal(
    evaluateSapEligibility({ ...base, hasPreOpenShift: false, totalCsp: 0 })
      .standing,
    "not_earning",
  );
  assert.equal(
    evaluateSapEligibility({ ...base, isStaff: true }).standing,
    "not_earning",
  );
  // An explicit date (override or assignment) lifts the grey back to normal.
  assert.equal(
    evaluateSapEligibility({ ...base, isStaff: true, hasDateOverride: true })
      .standing,
    "complete",
  );
  assert.equal(
    evaluateSapEligibility({
      ...base,
      hasPreOpenShift: false,
      hasDateOverride: true,
      totalCsp: 0,
    }).standing,
    "missing",
  );
});

test("isPreOpenShift compares against Open Sunday", () => {
  assert.equal(isPreOpenShift(null, "2026-08-30"), false);
  assert.equal(isPreOpenShift("2026-08-25", "2026-08-30"), true);
  assert.equal(isPreOpenShift("2026-08-30", "2026-08-30"), true);
  assert.equal(isPreOpenShift("2026-09-02", "2026-08-30"), false);
  assert.equal(isPreOpenShift("2026-09-02", null), true);
});
