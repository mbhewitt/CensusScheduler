import assert from "node:assert/strict";
import { test } from "node:test";

import { safeReturnTo } from "../../src/utils/safeReturnTo";

test("safeReturnTo: honors a returnTo to the user's OWN volunteer page", () => {
  assert.equal(safeReturnTo("/volunteers/42/info", 42), "/volunteers/42/info");
  assert.equal(safeReturnTo("/volunteers/42/schedule", 42), "/volunteers/42/schedule");
});

test("safeReturnTo: rejects ANOTHER volunteer's page (the Miah/Lizard King bug)", () => {
  assert.equal(safeReturnTo("/volunteers/999/info", 42), "/volunteers/42/info");
  assert.equal(safeReturnTo("/volunteers/999/schedule", 42), "/volunteers/42/info");
});

test("safeReturnTo: honors safe shared pages", () => {
  assert.equal(safeReturnTo("/shifts", 42), "/shifts");
  assert.equal(safeReturnTo("/training/confirmation/abc", 42), "/training/confirmation/abc");
});

test("safeReturnTo: falls back for missing / external / non-path values", () => {
  assert.equal(safeReturnTo(null, 42), "/volunteers/42/info");
  assert.equal(safeReturnTo(undefined, 42), "/volunteers/42/info");
  assert.equal(safeReturnTo("https://evil.example.com", 42), "/volunteers/42/info");
  assert.equal(safeReturnTo("javascript:alert(1)", 42), "/volunteers/42/info");
});
