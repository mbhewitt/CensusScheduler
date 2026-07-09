import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqToggleWelcomeComplete } from "@/components/types/volunteer-info";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { isOwnerOrAdmin } from "@/lib/authz";

const ROLE_WELCOME_COMPLETE_ID = 174766;

const welcomeComplete = async (
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
      const { complete }: IReqToggleWelcomeComplete = JSON.parse(req.body);

      // GET (info/index.ts) computes welcomeComplete from row existence:
      // `roleIdSet.has(ROLE_WELCOME_COMPLETE_ID)`. So to actually uncheck
      // the box we must DELETE the row; flipping add_role/remove_role keeps
      // it visible. (Mirrors profile-updated, issue #332.)
      if (complete === false) {
        await pool.query<RowDataPacket[]>(
          `DELETE FROM op_volunteer_roles
          WHERE role_id=?
          AND shiftboard_id=?`,
          [ROLE_WELCOME_COMPLETE_ID, shiftboardId]
        );
        return res.status(200).json({
          statusCode: 200,
          message: "Deleted",
        });
      }

      // complete === true: ensure the row exists with add_role=true.
      const [dbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT shiftboard_id
        FROM op_volunteer_roles
        WHERE role_id=?
        AND shiftboard_id=?`,
        [ROLE_WELCOME_COMPLETE_ID, shiftboardId]
      );
      const [dbVolunteerRoleFirst] = dbVolunteerRoleList;

      if (dbVolunteerRoleFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles
          SET add_role=?, remove_role=?
          WHERE role_id=?
          AND shiftboard_id=?`,
          [true, false, ROLE_WELCOME_COMPLETE_ID, shiftboardId]
        );
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_roles (
            add_role,
            remove_role,
            role_id,
            shiftboard_id
          )
          VALUES (?, ?, ?, ?)`,
          [true, false, ROLE_WELCOME_COMPLETE_ID, shiftboardId]
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

export default withAuth(welcomeComplete);
