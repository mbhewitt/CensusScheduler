import type { RowDataPacket } from "mysql2";

import {
  ROLE_ADMIN_ID,
  ROLE_PEERS_COORDINATOR_ID,
  ROLE_PEERS_SHIFT_LEAD_ID,
  ROLE_SUPER_ADMIN_ID,
} from "@/constants";
import { pool } from "lib/database";

// Server-side authorization helpers for the /api/volunteers/[shiftboardId]/*
// family. `withAuth` already guarantees a valid session (logged in); these add
// the missing object-level check so a logged-in volunteer can only act on their
// OWN record, while admins can act on anyone's (the on-playa "admin helps a
// volunteer" workflow). See #410 (read IDOR) and #350 (passcode write).

// True if the given shiftboard_id holds the Admin or SuperAdmin role.
export async function isAdmin(shiftboardId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1
     FROM op_volunteer_roles
     WHERE shiftboard_id = ?
       AND role_id IN (?, ?)
       AND remove_role = false
     LIMIT 1`,
    [shiftboardId, ROLE_ADMIN_ID, ROLE_SUPER_ADMIN_ID]
  );
  return rows.length > 0;
}

// True if the given shiftboard_id holds the SuperAdmin role. Used to gate
// tablet device provisioning (mint QR, self-provision, deprovision).
export async function isSuperAdmin(shiftboardId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1
     FROM op_volunteer_roles
     WHERE shiftboard_id = ?
       AND role_id = ?
       AND remove_role = false
     LIMIT 1`,
    [shiftboardId, ROLE_SUPER_ADMIN_ID]
  );
  return rows.length > 0;
}

// True if the session may act on `requestedShiftboardId`: it's their own
// record, or they're an admin.
export async function isOwnerOrAdmin(
  session: { shiftboardId: number },
  requestedShiftboardId: number
): Promise<boolean> {
  if (session.shiftboardId === requestedShiftboardId) return true;
  return isAdmin(session.shiftboardId);
}

// PEERS #walkin: leadership hierarchy for the passcode-reset feature and the
// "a lead helps a subordinate on the kiosk" read access it needs.
//   admin/superadmin > coordinator > shift lead > (squaddie / everyone else)
// A volunteer's rank = the HIGHEST role they hold. You may manage anyone
// STRICTLY below you; admins may manage anyone (incl. other admins). This is
// the object-level gate papabear + Mew agreed to on 2026-07-23.
const RANK_ADMIN = 3;
const RANK_COORDINATOR = 2;
const RANK_SHIFT_LEAD = 1;
const RANK_NONE = 0;

// The leadership rank implied by a set of (non-removed) role ids. Shared by
// getLeadershipRank (one volunteer) and listManageableVolunteers (whole roster
// in one query) so both agree on the hierarchy.
function rankFromRoleIds(roleIds: Set<number>): number {
  if (roleIds.has(ROLE_ADMIN_ID) || roleIds.has(ROLE_SUPER_ADMIN_ID)) {
    return RANK_ADMIN;
  }
  if (roleIds.has(ROLE_PEERS_COORDINATOR_ID)) return RANK_COORDINATOR;
  if (roleIds.has(ROLE_PEERS_SHIFT_LEAD_ID)) return RANK_SHIFT_LEAD;
  return RANK_NONE;
}

async function getLeadershipRank(shiftboardId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT role_id
     FROM op_volunteer_roles
     WHERE shiftboard_id = ?
       AND remove_role = false`,
    [shiftboardId]
  );
  return rankFromRoleIds(new Set(rows.map((row) => Number(row.role_id))));
}

// True if the session may manage `requestedShiftboardId` under the leadership
// hierarchy: it's their own record, they're an admin (manages anyone), or they
// outrank the target (coordinator > shift lead > squaddie). Used for the
// passcode-reset write AND the read access a lead needs to open a
// subordinate's page at the kiosk. Mutations that grant roles / edit contact
// info stay strictly `isOwnerOrAdmin` — this only widens passcode-reset + read.
export async function canManageVolunteer(
  session: { shiftboardId: number },
  requestedShiftboardId: number
): Promise<boolean> {
  if (session.shiftboardId === requestedShiftboardId) return true;
  const requesterRank = await getLeadershipRank(session.shiftboardId);
  if (requesterRank === RANK_ADMIN) return true;
  if (requesterRank === RANK_NONE) return false;
  const targetRank = await getLeadershipRank(requestedShiftboardId);
  return requesterRank > targetRank;
}

// PEERS "Reset Volly Passcode": the passcode-reset scope is WIDER than
// canManageVolunteer — a leader may reset a SAME-RANK peer's passcode too
// (lead↔lead, coordinator↔coordinator), not just people strictly below
// (papabear 2026-08-30). Rule: your rank or below, never above. Self and admins
// always allowed; squaddies (RANK_NONE) never. This deliberately does NOT widen
// the read/info gate (that stays canManageVolunteer, strict-below) so a leader
// still can't browse a peer's account details — only reset their code.
export async function canResetPasscode(
  session: { shiftboardId: number },
  requestedShiftboardId: number
): Promise<boolean> {
  if (session.shiftboardId === requestedShiftboardId) return true;
  const requesterRank = await getLeadershipRank(session.shiftboardId);
  if (requesterRank === RANK_ADMIN) return true;
  if (requesterRank === RANK_NONE) return false;
  const targetRank = await getLeadershipRank(requestedShiftboardId);
  return requesterRank >= targetRank;
}

export interface IManageableVolunteer {
  playaName: string;
  shiftboardId: number;
  worldName: string;
}

// PEERS "Reset Volly Passcode": the roster a leader may reset passcodes for,
// i.e. everyone `canResetPasscode` would say yes to — their rank or below, self
// excluded (you don't reset your own from this tool). Computed in ONE roster
// query rather than N per-volunteer rank lookups. Returns [] for a non-leader
// (RANK_NONE) so the server never hands a squaddie an enumerable roster.
// Ordered by playa name to match the sign-in name picker. The passcode-reset
// endpoint still re-checks canResetPasscode per target — this only decides who
// is offered.
export async function listManageableVolunteers(session: {
  shiftboardId: number;
}): Promise<IManageableVolunteer[]> {
  const requesterRank = await getLeadershipRank(session.shiftboardId);
  if (requesterRank === RANK_NONE) return [];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       v.shiftboard_id,
       v.playa_name,
       v.world_name,
       vr.role_id
     FROM op_volunteers AS v
     LEFT JOIN op_volunteer_roles AS vr
       ON vr.shiftboard_id = v.shiftboard_id
       AND vr.remove_role = false
     ORDER BY v.playa_name COLLATE utf8mb4_general_ci`
  );

  // Collapse the role-per-row join into one entry per volunteer, preserving the
  // playa-name ordering from the query (Map keeps insertion order).
  const byId = new Map<
    number,
    { playaName: string; worldName: string; roleIds: Set<number> }
  >();
  for (const row of rows) {
    const shiftboardId = Number(row.shiftboard_id);
    let entry = byId.get(shiftboardId);
    if (!entry) {
      entry = {
        playaName: row.playa_name,
        worldName: row.world_name ?? "",
        roleIds: new Set<number>(),
      };
      byId.set(shiftboardId, entry);
    }
    if (row.role_id) entry.roleIds.add(Number(row.role_id));
  }

  const manageable: IManageableVolunteer[] = [];
  for (const [shiftboardId, entry] of byId) {
    // Skip self, then mirror canResetPasscode: admins reset anyone; other
    // leaders reset anyone at their rank or below (peers included).
    if (shiftboardId !== session.shiftboardId) {
      const targetRank = rankFromRoleIds(entry.roleIds);
      if (requesterRank === RANK_ADMIN || requesterRank >= targetRank) {
        manageable.push({
          playaName: entry.playaName,
          shiftboardId,
          worldName: entry.worldName,
        });
      }
    }
  }
  return manageable;
}
