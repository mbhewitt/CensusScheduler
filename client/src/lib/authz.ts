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

async function getLeadershipRank(shiftboardId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT role_id
     FROM op_volunteer_roles
     WHERE shiftboard_id = ?
       AND remove_role = false`,
    [shiftboardId]
  );
  const roleIds = new Set(rows.map((row) => Number(row.role_id)));
  if (roleIds.has(ROLE_ADMIN_ID) || roleIds.has(ROLE_SUPER_ADMIN_ID)) {
    return RANK_ADMIN;
  }
  if (roleIds.has(ROLE_PEERS_COORDINATOR_ID)) return RANK_COORDINATOR;
  if (roleIds.has(ROLE_PEERS_SHIFT_LEAD_ID)) return RANK_SHIFT_LEAD;
  return RANK_NONE;
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
