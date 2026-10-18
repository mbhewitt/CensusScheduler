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
  department: null,
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
  subjectDepartments: new Set(),
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

test("lead access from the position held (Mew): Gate Sampling Lead → Sampling", () => {
  const GATE_SAMPLING_LEAD = 700;
  const leadView = [
    g({
      granteeType: "position",
      granteeId: GATE_SAMPLING_LEAD,
      relationship: "department",
      department: "Sampling",
    }),
  ];
  const inSampling = { subjectDepartments: new Set(["Sampling"]) };
  assert.equal(
    isAllowed(
      leadView,
      facts({ ...inSampling, positionIds: new Set([GATE_SAMPLING_LEAD]) })
    ),
    true
  );
  // Not signed up for the lead position: no.
  assert.equal(isAllowed(leadView, facts(inSampling)), false);
  // Signed out never counts, even with stale facts.
  assert.equal(
    isAllowed(
      leadView,
      facts({
        ...inSampling,
        signedIn: false,
        positionIds: new Set([GATE_SAMPLING_LEAD]),
      })
    ),
    false
  );
});

test("department comes from the grant: a role sees its own department", () => {
  const SAMPLING_LEAD = 95152;
  const leadView = [
    g({
      granteeId: SAMPLING_LEAD,
      relationship: "department",
      department: "Sampling",
      windowKey: "event_access",
    }),
  ];
  const lead = { roleIds: new Set([SAMPLING_LEAD]) };
  const inSampling = { subjectDepartments: new Set(["Sampling", "Tech"]) };
  const open = { openWindows: new Set(["event_access"]) };
  assert.equal(
    isAllowed(leadView, facts({ ...lead, ...inSampling, ...open })),
    true
  );
  // Outside the window, or another department, or without the role: no.
  assert.equal(isAllowed(leadView, facts({ ...lead, ...inSampling })), false);
  assert.equal(
    isAllowed(
      leadView,
      facts({ ...lead, ...open, subjectDepartments: new Set(["DataEntry"]) })
    ),
    false
  );
  assert.equal(isAllowed(leadView, facts({ ...inSampling, ...open })), false);
});

test("off_playa grants don't apply on-playa", () => {
  const offOnly = [g({ granteeType: "signed_in", place: "off_playa" })];
  assert.equal(isAllowed(offOnly, facts()), true);
  assert.equal(isAllowed(offOnly, facts({ onPlaya: true })), false);
});
