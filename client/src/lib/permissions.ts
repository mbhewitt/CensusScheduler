import type { RowDataPacket } from "mysql2";

import {
  type Grant,
  type Permission,
  grantMayApply,
  isAllowed,
} from "@/lib/permissions.logic";
import { pool } from "lib/database";

// can(): the single server-side permission check for the configurable
// permissions module (#804). Grants live in op_permission_grant, windows in
// op_time_window (migration 021). Matching is in permissions.logic.ts. This
// file only loads the facts it needs. Not called by any route yet (step 3).

export interface CanContext {
  onPlaya: boolean; // isOnPlayaRequest(req.cookies)
  subjectShiftboardId?: number; // the volunteer being acted on
  shiftTimesId?: number; // the shift being acted on
}

const idSet = async (sql: string, params: unknown[]): Promise<Set<number>> => {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return new Set(rows.map((row) => Number(row.id)));
};

// Active signups on one shift, as position_type_id per volunteer.
const ON_SHIFT = `
  FROM op_volunteer_shifts AS vs
  JOIN op_shift_time_position AS stp
    ON stp.time_position_id = vs.time_position_id
    AND stp.remove_time_position = false
  WHERE vs.remove_shift = false AND stp.shift_times_id = ?`;

// Which of `keys` are open right now. Shift times are stored playa-local, so
// compare against CONVERT_TZ(NOW()) like the walk-up check-in window does.
// A NULL anchor is open-ended. With no shift given, a shift-anchored bound
// counts as closed (never as open).
const BOUND = (side: "start" | "end", open: string) =>
  `COALESCE(DATE_ADD(CASE w.${side}_anchor
      WHEN 'shift_start' THEN st.start_time
      WHEN 'shift_end' THEN st.end_time END,
    INTERVAL w.${side}_offset_min MINUTE), '${open}')`;
const openWindowKeys = async (
  keys: string[],
  shiftTimesId: number | undefined
): Promise<Set<string>> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT w.window_key
    FROM op_time_window AS w
    LEFT JOIN op_shift_times AS st
      ON st.shift_times_id = ? AND st.remove_shift_time = false
    WHERE w.window_key IN (?)
      AND (st.shift_times_id IS NOT NULL
        OR (w.start_anchor IS NULL AND w.end_anchor IS NULL))
      AND CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles') BETWEEN
        ${BOUND("start", "1000-01-01")} AND ${BOUND("end", "9999-12-31")}`,
    [shiftTimesId ?? -1, keys]
  );
  return new Set(rows.map((row) => String(row.window_key)));
};

export async function can(
  session: { shiftboardId: number } | null,
  permission: Permission,
  ctx: CanContext
): Promise<boolean> {
  // Non-positive ids (the walk-up GUEST_SESSION, unfilled 0) are never a user.
  const actorId =
    session && session.shiftboardId > 0 ? session.shiftboardId : null;
  const [[grantRows], roleIds, positionIds] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT grantee_type, grantee_id, relationship, window_key, place
      FROM op_permission_grant
      WHERE permission = ?`,
      [permission]
    ),
    actorId
      ? idSet(
          `SELECT role_id AS id
          FROM op_volunteer_roles
          WHERE shiftboard_id = ? AND remove_role = false`,
          [actorId]
        )
      : new Set<number>(),
    // Positions only count on the shift being acted on: leading Monday's
    // shift gives no control over Tuesday's.
    actorId && ctx.shiftTimesId
      ? idSet(
          `SELECT stp.position_type_id AS id ${ON_SHIFT} AND vs.shiftboard_id = ?`,
          [ctx.shiftTimesId, actorId]
        )
      : new Set<number>(),
  ]);

  const base = {
    signedIn: actorId !== null,
    roleIds,
    positionIds,
    onPlaya: ctx.onPlaya,
  };
  const grants: Grant[] = grantRows
    .map((row) => ({
      granteeType: row.grantee_type,
      granteeId: row.grantee_id === null ? null : Number(row.grantee_id),
      relationship: row.relationship,
      windowKey: row.window_key,
      place: row.place,
    }))
    .filter((grant) => grantMayApply(grant, base));
  if (grants.length === 0) return false;

  // Only query the facts some remaining grant actually depends on.
  const windowKeys = [
    ...new Set(grants.flatMap((grant) => grant.windowKey ?? [])),
  ];
  const [onShift, openWindows] = await Promise.all([
    grants.some((grant) => grant.relationship === "shift") &&
    actorId &&
    ctx.shiftTimesId
      ? idSet(
          `SELECT DISTINCT vs.shiftboard_id AS id ${ON_SHIFT}
            AND vs.shiftboard_id IN (?, ?)`,
          [ctx.shiftTimesId, actorId, ctx.subjectShiftboardId ?? actorId]
        ).then(
          (ids) =>
            ids.has(actorId) &&
            (ctx.subjectShiftboardId === undefined ||
              ids.has(ctx.subjectShiftboardId))
        )
      : false,
    windowKeys.length > 0
      ? openWindowKeys(windowKeys, ctx.shiftTimesId)
      : new Set<string>(),
  ]);

  return isAllowed(grants, {
    ...base,
    isSelf: actorId !== null && ctx.subjectShiftboardId === actorId,
    onShift,
    openWindows,
  });
}
