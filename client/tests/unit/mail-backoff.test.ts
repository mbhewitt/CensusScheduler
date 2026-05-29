import { strict as assert } from "node:assert";
import { test } from "node:test";

import { nextAttemptDelaySeconds } from "../../lib/mail/backoff";

test("backoff: schedule per attempt", () => {
  assert.equal(nextAttemptDelaySeconds(1), 60);
  assert.equal(nextAttemptDelaySeconds(2), 300);
  assert.equal(nextAttemptDelaySeconds(3), 900);
  assert.equal(nextAttemptDelaySeconds(4), 3_600);
  assert.equal(nextAttemptDelaySeconds(5), 21_600);
  assert.equal(nextAttemptDelaySeconds(6), 86_400);
});

test("backoff: caps at 24h forever (on-playa scenario)", () => {
  // Even after a week of attempts, we keep retrying every 24h.
  // Permanent failure is what should mark `dead`, not retry exhaustion.
  for (const attempts of [7, 10, 50, 1000]) {
    assert.equal(nextAttemptDelaySeconds(attempts), 86_400);
  }
});

test("backoff: defensive on zero/negative input", () => {
  assert.equal(nextAttemptDelaySeconds(0), 60);
  assert.equal(nextAttemptDelaySeconds(-3), 60);
});
