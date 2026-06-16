import type { RowDataPacket } from "mysql2";

import { ROLE_ADMIN_ID, ROLE_SUPER_ADMIN_ID } from "@/constants";
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
