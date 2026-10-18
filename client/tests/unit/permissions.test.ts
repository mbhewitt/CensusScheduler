import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  type Facts,
  type Grant,
  isAllowed,
} from "../../src/lib/permissions.logic";

const SUPER_ADMIN = 1;
const ADMIN = 2;

const g = (over: Partial<Grant>): Grant => ({
  granteeType: "role",
  granteeId: null,
  relationship: "everyone",
  windowKey: null,
  place: "any",
  ...over,
});

const facts = (over: Partial<Facts> = {}): Facts => ({
  signedIn: true,
  roleIds: new Set(),
  positionIds: new Set(),
  onPlaya: false,
  isSelf: false,
  onShift: false,
  openWindows: new Set(),
  ...over,
});

// Mirrors the shift_volunteers:check_in seed in migrations/021_permission_grants.sql.
const CHECK_IN: Grant[] = [
  g({ granteeId: SUPER_ADMIN }),
  g({ granteeId: ADMIN }),
  g({ granteeType: "signed_in", place: "on_playa" }),
  g({ granteeType: "anyone", place: "on_playa", windowKey: "walkup_checkin" }),
];

test("check-in matches today: admin anywhere, volunteers on-playa only", () => {
  assert.equal(isAllowed(CHECK_IN, facts({ roleIds: new Set([ADMIN]) })), true);
  assert.equal(isAllowed(CHECK_IN, facts()), false);
  assert.equal(isAllowed(CHECK_IN, facts({ onPlaya: true })), true);
});

test("signed-out walk-up check-in needs on-playa AND the window", () => {
  const guest = { signedIn: false, onPlaya: true };
  assert.equal(isAllowed(CHECK_IN, facts(guest)), false);
  assert.equal(
    isAllowed(
      CHECK_IN,
      facts({ ...guest, openWindows: new Set(["walkup_checkin"]) })
    ),
    true
  );
  // Role ids never count for a signed-out actor.
  assert.equal(
    isAllowed(CHECK_IN, facts({ signedIn: false, roleIds: new Set([ADMIN]) })),
    false
  );
});

test("own-record grants only match self", () => {
  const record = [
    g({ granteeType: "signed_in", relationship: "self" }),
    g({ granteeId: ADMIN }),
  ];
  assert.equal(isAllowed(record, facts({ isSelf: true })), true);
  assert.equal(isAllowed(record, facts()), false);
  assert.equal(isAllowed(record, facts({ roleIds: new Set([ADMIN]) })), true);
});

test("lead controls only the shift they lead (Mew): position held on THIS shift", () => {
  const GATE_SAMPLING_LEAD = 700;
  const leadCheckIn = [
    g({ granteeType: "position", granteeId: GATE_SAMPLING_LEAD }),
  ];
  // can() loads positionIds for the shift acted on only.
  assert.equal(
    isAllowed(
      leadCheckIn,
      facts({ positionIds: new Set([GATE_SAMPLING_LEAD]) })
    ),
    true
  );
  // Leading some other shift (positionIds empty for this one): no.
  assert.equal(isAllowed(leadCheckIn, facts()), false);
  // Signed out never counts, even with stale facts.
  assert.equal(
    isAllowed(
      leadCheckIn,
      facts({ signedIn: false, positionIds: new Set([GATE_SAMPLING_LEAD]) })
    ),
    false
  );
});

test("shift relationship needs the actor (and subject) on the shift", () => {
  const notes = [g({ granteeType: "signed_in", relationship: "shift" })];
  assert.equal(isAllowed(notes, facts({ onShift: true })), true);
  assert.equal(isAllowed(notes, facts()), false);
});

test("off_playa grants don't apply on-playa", () => {
  const offOnly = [g({ granteeType: "signed_in", place: "off_playa" })];
  assert.equal(isAllowed(offOnly, facts()), true);
  assert.equal(isAllowed(offOnly, facts({ onPlaya: true })), false);
});
