import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { BEHAVIORAL_STANDARDS_TEXT } from "src/constants";

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  const { isBehavioralStandardsSigned, shiftboardId } = JSON.parse(req.body);

  if (req.method === "POST") {
    const [dbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
      `SELECT *
      FROM op_volunteer_roles
      WHERE roles=? AND shiftboard_id=?`,
      [BEHAVIORAL_STANDARDS_TEXT, shiftboardId]
    );
    const dbVolunteerRoleItem = dbVolunteerRoleList[0];
    const [addRole, deleteRole] = [
      isBehavioralStandardsSigned === true,
      isBehavioralStandardsSigned === false,
    ];

    // if behavioral standards row exists
    // then update behavioral standards row
    if (dbVolunteerRoleItem) {
      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteer_roles
        SET add_role=?, delete_role=?
        WHERE roles=? AND shiftboard_id=?`,
        [addRole, deleteRole, BEHAVIORAL_STANDARDS_TEXT, shiftboardId]
      );
      // else insert behavioral standards row
    } else {
      await pool.query<RowDataPacket[]>(
        `INSERT INTO op_volunteer_roles (add_role, delete_role, roles, shiftboard_id)
        VALUES (?, ?, ?, ?)`,
        [addRole, deleteRole, BEHAVIORAL_STANDARDS_TEXT, shiftboardId]
      );
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Success",
    });
  }

  return res.status(404).json({
    statusCode: 404,
    message: "Not found",
  });
};

export default contact;
