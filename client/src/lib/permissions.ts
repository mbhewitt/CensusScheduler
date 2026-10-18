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

// Departments (op_shift_category.department) of the shift acted on, or, with
// no shift, of every shift the subject volunteer is signed up for.
const subjectDepartmentSet = async ({
  shiftTimesId,
  subjectShiftboardId,
}: CanContext): Promise<Set<string>> => {
  if (!shiftTimesId && !subjectShiftboardId) return new Set();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT c.department
    FROM op_shift_times AS st
    JOIN op_shift_name AS sn ON sn.shift_name_id = st.shift_name_id
    JOIN op_shift_category AS c ON c.shift_category_id = sn.shift_category_id
    WHERE st.shift_times_id = ?
      OR st.shift_times_id IN (
        SELECT stp.shift_times_id
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_time_position AS stp
          ON stp.time_position_id = vs.time_position_id
        WHERE vs.shiftboard_id = ? AND vs.remove_shift = false
      )`,
    [shiftTimesId ?? -1, shiftTimesId ? -1 : (subjectShiftboardId ?? -1)]
  );
  return new Set(rows.map((row) => String(row.department)));
};

// Which of `keys` are open right now. Shift times are stored playa-local, so
// compare against CONVERT_TZ(NOW()) like the walk-up check-in window does.
// A NULL anchor is open-ended. A shift anchor with no shift given, or a date
// anchor whose op_dates row is gone, counts as closed (never as open).
const BOUND = (side: "start" | "end", alias: string, open: string) =>
  `COALESCE(DATE_ADD(CASE w.${side}_anchor
      WHEN 'shift_start' THEN st.start_time
      WHEN 'shift_end' THEN st.end_time
      WHEN 'date' THEN ${alias}.date END,
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
    LEFT JOIN op_dates AS sd ON sd.date_id = w.start_date_id
    LEFT JOIN op_dates AS ed ON ed.date_id = w.end_date_id
    WHERE w.window_key IN (?)
      AND (st.shift_times_id IS NOT NULL OR (
        COALESCE(w.start_anchor, '') NOT LIKE 'shift%'
        AND COALESCE(w.end_anchor, '') NOT LIKE 'shift%'))
      AND (COALESCE(w.start_anchor, '') <> 'date' OR sd.date IS NOT NULL)
      AND (COALESCE(w.end_anchor, '') <> 'date' OR ed.date IS NOT NULL)
      AND CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles') BETWEEN
        ${BOUND("start", "sd", "1000-01-01")}
        AND ${BOUND("end", "ed", "9999-12-31")}`,
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
      `SELECT grantee_type, grantee_id, relationship, department, window_key, place
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
    // ponytail: op_ tables hold one season, so "signed up" = this year.
    actorId
      ? idSet(
          `SELECT DISTINCT stp.position_type_id AS id
          FROM op_volunteer_shifts AS vs
          JOIN op_shift_time_position AS stp
            ON stp.time_position_id = vs.time_position_id
            AND stp.remove_time_position = false
          WHERE vs.shiftboard_id = ? AND vs.remove_shift = false`,
          [actorId]
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
      department: row.department,
      windowKey: row.window_key,
      place: row.place,
    }))
    .filter((grant) => grantMayApply(grant, base));
  if (grants.length === 0) return false;

  // Only query the facts some remaining grant actually depends on.
  const needs = (relationship: Grant["relationship"]) =>
    grants.some((grant) => grant.relationship === relationship);
  const windowKeys = [
    ...new Set(grants.flatMap((grant) => grant.windowKey ?? [])),
  ];
  const [onShift, subjectDepartments, openWindows] = await Promise.all([
    needs("shift") && actorId && ctx.shiftTimesId
      ? idSet(
          `SELECT 1 AS id
          FROM op_volunteer_shifts AS vs
          JOIN op_shift_time_position AS stp
            ON stp.time_position_id = vs.time_position_id
          WHERE vs.shiftboard_id = ?
            AND vs.remove_shift = false
            AND stp.shift_times_id = ?
          LIMIT 1`,
          [actorId, ctx.shiftTimesId]
        ).then((rows) => rows.size > 0)
      : false,
    needs("department") ? subjectDepartmentSet(ctx) : new Set<string>(),
    windowKeys.length > 0
      ? openWindowKeys(windowKeys, ctx.shiftTimesId)
      : new Set<string>(),
  ]);

  return isAllowed(grants, {
    ...base,
    isSelf: actorId !== null && ctx.subjectShiftboardId === actorId,
    onShift,
    subjectDepartments,
    openWindows,
  });
}
