import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqToggleOtherSap } from "@/components/types/volunteer-info";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { isOwnerOrAdmin } from "@/lib/authz";

const ROLE_OTHER_SAP_ID = 2000007;

const otherSap = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  if (!(await isOwnerOrAdmin(session, Number(shiftboardId)))) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }

  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      const { hasOtherSap }: IReqToggleOtherSap = JSON.parse(req.body);
      const [addRole, removeRole] = [
        hasOtherSap === true,
        hasOtherSap === false,
      ];

      // check if role row exists
      const [dbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT shiftboard_id
        FROM op_volunteer_roles
        WHERE role_id=?
        AND shiftboard_id=?`,
        [ROLE_OTHER_SAP_ID, shiftboardId]
      );
      const [dbVolunteerRoleFirst] = dbVolunteerRoleList;

      if (dbVolunteerRoleFirst) {
        // update existing row
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles
          SET add_role=?, remove_role=?
          WHERE role_id=?
          AND shiftboard_id=?`,
          [addRole, removeRole, ROLE_OTHER_SAP_ID, shiftboardId]
        );
      } else {
        // insert new row
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_roles (
            add_role,
            remove_role,
            role_id,
            shiftboard_id
          )
          VALUES (?, ?, ?, ?)`,
          [addRole, removeRole, ROLE_OTHER_SAP_ID, shiftboardId]
        );
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
    }

    // default
    // ------------------------------------------------------------
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default withAuth(otherSap);
