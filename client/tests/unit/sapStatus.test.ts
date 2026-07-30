import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluateSapEligibility, REQUIRED_CSP } from "../../lib/sapStatus";

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
  hasEligibleShift: true,
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
    hasEligibleShift: false,
  });
  assert.equal(e.standing, "external");
});

test("no eligible shift -> not_earning, unless staff", () => {
  assert.equal(
    evaluateSapEligibility({ ...base, hasEligibleShift: false, totalCsp: 0 })
      .standing,
    "not_earning",
  );
  assert.equal(
    evaluateSapEligibility({
      ...base,
      hasEligibleShift: false,
      isStaff: true,
      totalCsp: 0,
    }).standing,
    "missing",
  );
});
