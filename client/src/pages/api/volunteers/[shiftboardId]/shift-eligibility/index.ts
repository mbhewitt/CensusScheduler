import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { isOwnerOrAdmin } from "@/lib/authz";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";

// Read-only. For the requesting volunteer, returns which upcoming shifts they
// are NOT eligible to take because every position on the shift requires a role
// they don't hold — plus the required role name(s) so the UI can explain why.
//
// Shape: { [timeId]: string[] }  — timeId -> required role name(s). A shift is
// omitted when the volunteer CAN take at least one of its positions (i.e. that
// position needs no role, or they hold the role). Deliberately does NOT touch
// the shared /api/shifts endpoint or the signup path — server-side signup
// enforcement is tracked separately in #458.
const shiftEligibility = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  if (!(await isOwnerOrAdmin(session, Number(shiftboardId)))) {
    return res
      .status(403)
      .json({ statusCode: 403, message: "Forbidden" });
  }

  switch (req.method) {
    case "GET": {
      // One row per (shift, position): whether the volunteer can take that
      // position role-wise, and the role it requires if not.
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
          st.shift_times_id AS timeId,
          r.role AS roleName,
          (CASE
             WHEN pt.role_id IS NULL OR pt.role_id = 0 THEN 1
             WHEN vr.shiftboard_id IS NOT NULL THEN 1
             ELSE 0
           END) AS takeable
        FROM op_shift_times AS st
        JOIN op_shift_time_position AS stp
          ON stp.shift_times_id = st.shift_times_id
          AND stp.remove_time_position = false
        JOIN op_position_type AS pt
          ON pt.position_type_id = stp.position_type_id
          AND pt.delete_position = false
        LEFT JOIN op_roles AS r
          ON r.role_id = pt.role_id
        LEFT JOIN op_volunteer_roles AS vr
          ON vr.role_id = pt.role_id
          AND vr.shiftboard_id = ?
          AND vr.remove_role = false
        WHERE st.remove_shift_time = false
          AND st.canceled = false`,
        [Number(shiftboardId)]
      );

      // A shift is takeable if ANY of its positions is takeable. Collect the
      // required role names only for shifts where none are.
      const byShift = new Map<
        number,
        { takeable: boolean; roles: Set<string> }
      >();
      for (const row of rows) {
        const entry = byShift.get(row.timeId) ?? {
          takeable: false,
          roles: new Set<string>(),
        };
        if (row.takeable) {
          entry.takeable = true;
        } else if (row.roleName) {
          entry.roles.add(row.roleName);
        }
        byShift.set(row.timeId, entry);
      }

      const ineligible: Record<number, string[]> = {};
      for (const [timeId, entry] of byShift) {
        if (!entry.takeable) {
          ineligible[timeId] = Array.from(entry.roles);
        }
      }

      return res.status(200).json(ineligible);
    }

    default: {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Not found" });
    }
  }
};

export default withAuth(shiftEligibility);
