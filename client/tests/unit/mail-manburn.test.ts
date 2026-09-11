import { strict as assert } from "node:assert";
import { test } from "node:test";

import { manBurnCountdown } from "../../lib/mail/manBurn";

// The Man burns 9pm the Saturday before Labor Day. 2026: Labor Day = Mon
// 2026-09-07, so BurnSat = 2026-09-05 21:00. All Dates below are local-time
// constructions; the countdown compares now vs burn in the same local frame,
// so results are timezone-independent.

test("manBurn: never negative — rolls to next year once this year's burn passes", () => {
  // Sep 11 2026, well after the 2026 burn → counts to the 2027 burn.
  assert.equal(manBurnCountdown(new Date(2026, 8, 11, 9, 30)), "358 days");
  // 1 hour AFTER the 2026 burn (Sat 10pm) → already rolled to 2027.
  assert.equal(manBurnCountdown(new Date(2026, 8, 5, 22, 0)), "363 days");
});

test("manBurn: days when >= 48h away", () => {
  assert.equal(manBurnCountdown(new Date(2026, 0, 1, 12, 0)), "247 days");
});

test("manBurn: switches to hours under 48h", () => {
  assert.equal(manBurnCountdown(new Date(2026, 8, 4, 10, 0)), "35 hours"); // day before
  assert.equal(manBurnCountdown(new Date(2026, 8, 5, 20, 0)), "1 hour"); // 1h before 9pm burn
});
