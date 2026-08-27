import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  ShiftAgg,
  buildConsolidatedEmail,
  buildNudgeEmail,
  evaluateShift,
} from "../../src/lib/shiftLeadNudge.logic";

function shift(nonLeads: ShiftAgg["nonLeads"], leadEmails: string[] = []): ShiftAgg {
  return { id: 1, name: "Setup", date: "2026-08-27", time: "09:00-13:00", leadEmails, nonLeads };
}
const v = (checkedIn: boolean, reviewed: boolean) => ({
  playaName: "P", worldName: "W", checkedIn, reviewed,
});

test("A fires: checked in but not reviewed", () => {
  const ev = evaluateShift(shift([v(true, false), v(true, true)]));
  assert.equal(ev.condA, true);
  assert.equal(ev.unreviewed.length, 1);
  assert.equal(ev.shouldNudge, true);
});

test("A does not fire when every checked-in is reviewed", () => {
  const ev = evaluateShift(shift([v(true, true), v(true, true)]));
  assert.equal(ev.condA, false);
});

test("B: 1 person not checked in = 100% not checked in → fires", () => {
  const ev = evaluateShift(shift([v(false, false)]));
  assert.equal(ev.condB, true);
  assert.equal(ev.pctCheckedIn, 0);
});

test("B: 1 of 2 checked in = 50% not checked in → fires (>30%)", () => {
  const ev = evaluateShift(shift([v(true, true), v(false, false)]));
  assert.equal(ev.condB, true);
  assert.equal(ev.pctCheckedIn, 50);
});

test("B does NOT fire at exactly 30% not checked in (strictly greater)", () => {
  // 3 of 10 not checked in = 30% — not > 30%.
  const nl = [
    ...Array.from({ length: 7 }, () => v(true, true)),
    ...Array.from({ length: 3 }, () => v(false, false)),
  ];
  const ev = evaluateShift(shift(nl));
  assert.equal(ev.condB, false);
  assert.equal(ev.pctCheckedIn, 70);
});

test("neither fires: all checked in and reviewed", () => {
  const ev = evaluateShift(shift([v(true, true), v(true, true), v(true, true)]));
  assert.equal(ev.shouldNudge, false);
});

test("no non-leads → nothing fires", () => {
  const ev = evaluateShift(shift([]));
  assert.equal(ev.shouldNudge, false);
  assert.equal(ev.pctCheckedIn, 0);
});

test("email includes both sections + shift link when A and B fire", () => {
  const agg = shift([v(true, false), v(false, false)]);
  const ev = evaluateShift(agg);
  const email = buildNudgeEmail(agg, ev);
  assert.match(email.subject, /Setup/);
  assert.match(email.bodyText, /not reviewed yet/);
  assert.match(email.bodyText, /% were checked in/);
  assert.match(email.bodyText, /\/shifts\/1\/volunteers/);
});

test("consolidated catch-up email lists every shift for the recipient", () => {
  const a = { id: 1, name: "Setup", date: "8/23", time: "14-18", leadEmails: [], nonLeads: [v(true, false)] };
  const b = { id: 2, name: "Setup", date: "8/24", time: "09-13", leadEmails: [], nonLeads: [v(false, false)] };
  const lines = [
    { agg: a, ev: evaluateShift(a) },
    { agg: b, ev: evaluateShift(b) },
  ];
  const email = buildConsolidatedEmail(false, lines);
  assert.match(email.subject, /2 shifts need wrap-up/);
  assert.match(email.bodyText, /\/shifts\/1\/volunteers/);
  assert.match(email.bodyText, /\/shifts\/2\/volunteers/);
  assert.match(email.bodyText, /you led/);
});
