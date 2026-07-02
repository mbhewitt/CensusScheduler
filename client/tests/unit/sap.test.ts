import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  autoTargetDay,
  burnYear,
  modeBurnYear,
  pickAutoSap,
  subtractOneDayISO,
} from "../../lib/sap";

test("burnYear: Jan-Sep is the calendar year", () => {
  assert.equal(burnYear("2025-08-16"), 2025);
  assert.equal(burnYear("2025-01-01"), 2025);
  assert.equal(burnYear("2025-09-30"), 2025);
});

test("burnYear: Oct-Dec rolls forward to year+1", () => {
  assert.equal(burnYear("2024-10-01"), 2025);
  assert.equal(burnYear("2024-12-31"), 2025);
});

test("modeBurnYear: picks the dominant event year, tolerates strays", () => {
  // A real op_dates: mostly Aug 2025 + one early-Oct 2024 stray → 2025.
  const dates = [
    "2025-08-16",
    "2025-08-17",
    "2025-08-18",
    "2025-09-03",
    "2024-10-15", // stray → burn year 2025 too, but tests the bucketing
  ];
  assert.equal(modeBurnYear(dates), 2025);
});

test("modeBurnYear: empty table -> null", () => {
  assert.equal(modeBurnYear([]), null);
});

test("modeBurnYear: ties break to the later year", () => {
  // One 2024 (Aug) and one 2025 (Aug): 1-1 tie -> 2025.
  assert.equal(modeBurnYear(["2024-08-10", "2025-08-10"]), 2025);
});

test("subtractOneDayISO: stable across month/year boundaries", () => {
  assert.equal(subtractOneDayISO("2025-08-17"), "2025-08-16");
  assert.equal(subtractOneDayISO("2025-09-01"), "2025-08-31");
  assert.equal(subtractOneDayISO("2025-01-01"), "2024-12-31");
});

test("autoTargetDay: day before the first CSP shift, or null", () => {
  assert.equal(autoTargetDay("2025-08-20"), "2025-08-19");
  assert.equal(autoTargetDay(null), null);
});

const pool = [
  { sapId: 1, sapDate: "2025-08-16" },
  { sapId: 2, sapDate: "2025-08-19" },
  { sapId: 3, sapDate: "2025-08-22" },
];

test("pickAutoSap: exact target day when in stock", () => {
  assert.equal(pickAutoSap("2025-08-19", pool)?.sapId, 2);
});

test("pickAutoSap: falls back to the CLOSEST earlier day", () => {
  // Target 8/21: no 8/21 in stock, closest earlier is 8/19 (not 8/16).
  assert.equal(pickAutoSap("2025-08-21", pool)?.sapId, 2);
});

test("pickAutoSap: never picks a later-dated SAP -> null (needs manual)", () => {
  // Target 8/15 is earlier than every SAP in the pool.
  assert.equal(pickAutoSap("2025-08-15", pool), null);
});

test("pickAutoSap: null target -> null", () => {
  assert.equal(pickAutoSap(null, pool), null);
});

test("pickAutoSap: empty pool -> null", () => {
  assert.equal(pickAutoSap("2025-08-20", []), null);
});
