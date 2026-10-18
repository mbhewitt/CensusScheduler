// Pure grant matching for the configurable permissions module (#804). NO db
// imports so it's trivially unit-testable. See permissions.ts for can(), which
// loads the grants + facts from the database.

// The catalog lives in code: a permission only means something once a route
// checks it. Add names here as routes move onto can() (#804 step 3).
export const PERMISSIONS = [
  "shift_setup:update",
  "roles:update",
  "role_members:manage",
  "superadmin_role:manage",
  "saps:manage",
  "qr_codes:manage",
  "printing:view",
  "tablets:provision",
  "volunteers:list",
  "volunteer_record:manage",
  "email_bounced:update",
  "shift_volunteers:add",
  "shift_volunteers:remove",
  "shift_volunteers:check_in",
  "shift_volunteers:review",
  "shift_volunteers:add_override", // ignore full slots + required role
  "volunteer_notes:view", // past shift ratings/notes
  "volunteer_passcode:reset",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type GranteeType = "anyone" | "signed_in" | "role" | "position";
export type Relationship = "everyone" | "self" | "shift";
export type Place = "any" | "on_playa" | "off_playa";

export interface Grant {
  granteeType: GranteeType;
  granteeId: number | null;
  relationship: Relationship;
  windowKey: string | null;
  place: Place;
}

// What we know about the actor and the thing acted on, for one check.
export interface Facts {
  signedIn: boolean;
  roleIds: ReadonlySet<number>;
  positionIds: ReadonlySet<number>; // positions the actor holds on this shift
  onPlaya: boolean;
  isSelf: boolean; // the subject volunteer is the actor
  onShift: boolean; // the actor (and the subject, if any) is on the shift
  openWindows: ReadonlySet<string>;
}

// Grantee + place only: decides which grants can apply before we spend
// queries on relationship/window facts.
export const grantMayApply = (
  g: Grant,
  f: Pick<Facts, "signedIn" | "roleIds" | "positionIds" | "onPlaya">
): boolean => {
  const grantee =
    g.granteeType === "anyone" ||
    (f.signedIn && g.granteeType === "signed_in") ||
    (f.signedIn &&
      g.granteeType === "role" &&
      g.granteeId !== null &&
      f.roleIds.has(g.granteeId)) ||
    (f.signedIn &&
      g.granteeType === "position" &&
      g.granteeId !== null &&
      f.positionIds.has(g.granteeId));
  const place = g.place === "any" || (g.place === "on_playa") === f.onPlaya;
  return grantee && place;
};

export const grantApplies = (g: Grant, f: Facts): boolean => {
  if (!grantMayApply(g, f)) return false;
  const related =
    g.relationship === "everyone" ||
    (g.relationship === "self" && f.isSelf) ||
    (g.relationship === "shift" && f.onShift);
  return related && (g.windowKey === null || f.openWindows.has(g.windowKey));
};

export const isAllowed = (grants: readonly Grant[], f: Facts): boolean =>
  grants.some((g) => grantApplies(g, f));
