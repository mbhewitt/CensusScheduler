// #226: new volunteer ids must come from the 10M+ generator, never from
// generateId() (random 1..1M, the range real Shiftboard ids live in).
// Run: node tests/db/new-user-id-range.mjs
import assert from "node:assert";
import { execSync } from "node:child_process";

const hits = execSync(
  `grep -rln "generateNewUserShiftboardId()" src/pages/api || true`
).toString();
for (const f of [
  "src/pages/api/auth/okta/callback.ts",
  "src/pages/api/volunteers/account/index.ts",
]) {
  assert(hits.includes(f), `${f} must use generateNewUserShiftboardId`);
}
const bad = execSync(
  `grep -rn -A3 "generateId(" src/pages/api | grep -i "op_volunteers" || true`
).toString();
assert.equal(bad, "", `generateId() used for op_volunteers ids:\n${bad}`);
console.log("ok: new volunteer ids use the 10M+ range");
