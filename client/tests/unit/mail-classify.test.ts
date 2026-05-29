import { strict as assert } from "node:assert";
import { test } from "node:test";

import { classifyError } from "../../lib/mail/classify";

test("classify: 550 → permanent", () => {
  const out = classifyError({ responseCode: 550, message: "user unknown" });
  assert.equal(out.permanent, true);
  assert.equal(out.reason, "user unknown");
});

test("classify: 553, 554 → permanent", () => {
  assert.equal(classifyError({ responseCode: 553 }).permanent, true);
  assert.equal(classifyError({ responseCode: 554 }).permanent, true);
});

test("classify: 4xx → transient", () => {
  assert.equal(classifyError({ responseCode: 421 }).permanent, false);
  assert.equal(classifyError({ responseCode: 450 }).permanent, false);
  assert.equal(classifyError({ responseCode: 451 }).permanent, false);
});

test("classify: connection-level / no SMTP code → transient", () => {
  // On-playa default: when in doubt, retry. A misclassified permanent
  // is irreversible; a misclassified transient just keeps retrying.
  assert.equal(
    classifyError({ code: "ECONNREFUSED", message: "no relay" }).permanent,
    false
  );
  assert.equal(classifyError(new Error("timeout")).permanent, false);
  assert.equal(classifyError(undefined).permanent, false);
});
