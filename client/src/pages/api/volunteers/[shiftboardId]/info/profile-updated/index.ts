import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IReqToggleProfileUpdated } from "@/components/types/volunteer-info";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";

const ROLE_BURNER_PROFILE_UPDATED_ID = 2000010;

const profileUpdated = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftboardId } = req.query;

  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      const { updated }: IReqToggleProfileUpdated = JSON.parse(req.body);

      // GET (info/index.ts) computes burnerProfileUpdated from row
      // existence: `roleIdSet.has(ROLE_BURNER_PROFILE_UPDATED_ID)`.
      // So to actually uncheck the box we must DELETE the row;
      // flipping add_role/remove_role keeps it visible. (Issue #332)
      if (updated === false) {
        await pool.query<RowDataPacket[]>(
          `DELETE FROM op_volunteer_roles
          WHERE role_id=?
          AND shiftboard_id=?`,
          [ROLE_BURNER_PROFILE_UPDATED_ID, shiftboardId]
        );
        return res.status(200).json({
          statusCode: 200,
          message: "Deleted",
        });
      }

      // updated === true: ensure the row exists with add_role=true.
      const [dbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT shiftboard_id
        FROM op_volunteer_roles
        WHERE role_id=?
        AND shiftboard_id=?`,
        [ROLE_BURNER_PROFILE_UPDATED_ID, shiftboardId]
      );
      const [dbVolunteerRoleFirst] = dbVolunteerRoleList;

      if (dbVolunteerRoleFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles
          SET add_role=?, remove_role=?
          WHERE role_id=?
          AND shiftboard_id=?`,
          [true, false, ROLE_BURNER_PROFILE_UPDATED_ID, shiftboardId]
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
          [true, false, ROLE_BURNER_PROFILE_UPDATED_ID, shiftboardId]
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

export default withAuth(profileUpdated);
