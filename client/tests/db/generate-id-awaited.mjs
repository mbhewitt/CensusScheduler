// #271/#529: generateId() must be async and awaited at every call site,
// otherwise it returns the id before the uniqueness check has run.
// Run: node tests/db/generate-id-awaited.mjs
import assert from "node:assert";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

assert(
  /export const generateId = async/.test(
    readFileSync("src/utils/generateId.ts", "utf8")
  ),
  "generateId must be async"
);
const bad = execSync(`grep -rn "generateId(" src/pages src/app src/lib || true`)
  .toString()
  .split("\n")
  .filter(
    (l) =>
      l && !l.includes("await generateId(") && !/^\S+:\d+:\s*(\/\/|\*)/.test(l)
  )
  .join("\n");
assert.equal(bad, "", `un-awaited generateId() calls:\n${bad}`);
console.log("ok: generateId is async and awaited everywhere");
