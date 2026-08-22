// Runnable self-check for the read-only block/allow contract (no test runner in
// this repo). Run: `npx tsx src/lib/readOnly.check.ts`. Guards the security-
// relevant rule that data writes are frozen while auth writes stay open.
import assert from "assert";

import { isBlockedWrite } from "@/lib/readOnly";

// Data mutations are blocked.
assert(isBlockedWrite("POST", "/api/dates"), "POST data route must be blocked");
assert(isBlockedWrite("DELETE", "/api/dates/1"), "DELETE must be blocked");
assert(isBlockedWrite("PATCH", "/api/shifts/types/1"), "PATCH must be blocked");
assert(isBlockedWrite("post", "/api/volunteers/1/shifts"), "case-insensitive method");

// Auth writes stay open so people can still sign in / provision.
assert(!isBlockedWrite("POST", "/api/sign-in"), "sign-in must stay open");
assert(!isBlockedWrite("POST", "/api/auth/sign-out"), "sign-out must stay open");
assert(!isBlockedWrite("POST", "/api/provision/claim"), "claim must stay open");

// Reads and non-API paths are never blocked.
assert(!isBlockedWrite("GET", "/api/dates"), "GET is never a write");
assert(!isBlockedWrite("POST", "/sign-in"), "non-/api path is not our concern");
assert(!isBlockedWrite(undefined, "/api/dates"), "missing method → not blocked");

// eslint-disable-next-line no-console
console.log("readOnly.check: all assertions passed");
