import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IReqRoleBehavioralStandardsItem } from "src/components/types/roles";
import { ROLE_BEHAVIORAL_STANDARDS_ID } from "src/constants";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // --------------------
    case "POST": {
      // create volunteer account
      const {
        isBehavioralStandardsSigned,
        shiftboardId,
      }: IReqRoleBehavioralStandardsItem = JSON.parse(req.body);
      const [dbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT shiftboard_id
        FROM op_volunteer_roles AS vr
        JOIN op_roles AS r
        ON vr.role_id=r.role_id
        WHERE vr.role_id=?
        AND vr.shiftboard_id=?`,
        [ROLE_BEHAVIORAL_STANDARDS_ID, shiftboardId]
      );
      const [dbVolunteerRoleFirst] = dbVolunteerRoleList;
      const [addRole, removeRole] = [
        isBehavioralStandardsSigned === true,
        isBehavioralStandardsSigned === false,
      ];

      // if behavioral standards row exists
      // then update behavioral standards row
      if (dbVolunteerRoleFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles
          SET
            add_role=?,
            remove_role=?
          WHERE role_id=?
          AND shiftboard_id=?`,
          [addRole, removeRole, ROLE_BEHAVIORAL_STANDARDS_ID, shiftboardId]
        );
        // else insert behavioral standards row
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_roles (
            add_role,
            remove_role,
            role_id,
            shiftboard_id
          )
          VALUES (?, ?, ?, ?)`,
          [addRole, removeRole, ROLE_BEHAVIORAL_STANDARDS_ID, shiftboardId]
        );
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
    }

    // default
    // --------------------
    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default contact;
