import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { BEHAVIORAL_STANDARDS_ID } from "src/constants";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "POST": {
      const { isBehavioralStandardsSigned, shiftboardId } = JSON.parse(
        req.body
      );
      const [dbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_volunteer_roles AS vr
        JOIN op_roles AS r
        ON vr.role_id=r.role_id
        WHERE vr.role_id=? AND shiftboard_id=?`,
        [BEHAVIORAL_STANDARDS_ID, shiftboardId]
      );
      const dbVolunteerRoleFirst = dbVolunteerRoleList[0];
      const [addRole, removeRole] = [
        isBehavioralStandardsSigned === true,
        isBehavioralStandardsSigned === false,
      ];

      // if behavioral standards row exists
      // then update behavioral standards row
      if (dbVolunteerRoleFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles
          SET add_role=?, remove_role=?
          WHERE role_id=? AND shiftboard_id=?`,
          [addRole, removeRole, BEHAVIORAL_STANDARDS_ID, shiftboardId]
        );
        // else insert behavioral standards row
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_roles (add_role, remove_role, role_id, shiftboard_id)
          VALUES (?, ?, ?, ?)`,
          [addRole, removeRole, BEHAVIORAL_STANDARDS_ID, shiftboardId]
        );
      }

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default contact;
