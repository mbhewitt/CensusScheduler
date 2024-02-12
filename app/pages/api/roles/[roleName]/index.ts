import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const roleVolunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleName } = req.query;
  switch (req.method) {
    // get - get all role volunteers
    case "GET": {
      const [dataDbRoleVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT playa_name, roles, vr.shiftboard_id, world_name
        FROM op_volunteer_roles AS vr
        JOIN op_volunteers AS v
        ON vr.shiftboard_id=v.shiftboard_id
        WHERE roles=? AND delete_role=false
        ORDER BY playa_name`,
        [roleName]
      );
      const dataRoleVolunteerList = dataDbRoleVolunteerList.map(
        ({ playa_name, roles, shiftboard_id, world_name }) => {
          return {
            playaName: playa_name,
            roleName: roles,
            shiftboardId: shiftboard_id,
            worldName: world_name,
          };
        }
      );

      return res.status(200).json({
        dataRoleVolunteerList,
      });
    }
    // delete - remove role volunteer
    case "DELETE": {
      const { shiftboardId } = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteer_roles
        SET add_role=0, delete_role=1
        WHERE roles=? AND shiftboard_id=?`,
        [roleName, shiftboardId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Success",
      });
    }
    // default - send an error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default roleVolunteers;
