// #207: account creation must reject a duplicate email (case-insensitive, 409).
// Static check, same style as new-user-id-range.mjs.
// Run: node tests/db/account-duplicate-email.mjs
import assert from "node:assert";
import { readFileSync } from "node:fs";

const src = readFileSync("src/pages/api/volunteers/account/index.ts", "utf8");
assert(
  /LOWER\(email\)=LOWER\(\?\)/.test(src),
  "email check must be case-insensitive"
);
assert(src.includes("status(409)"), "duplicate email must return 409");
assert(
  src.indexOf("status(409)") < src.indexOf("INSERT INTO op_volunteers"),
  "duplicate check must run before the insert"
);
console.log("ok: duplicate account email is rejected with 409");
