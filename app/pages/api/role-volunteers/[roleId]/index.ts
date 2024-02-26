import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const roleVolunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleId } = req.query;

  switch (req.method) {
    // get - get all role volunteers
    case "GET": {
      const [dbRoleVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT v.playa_name, r.role, vr.shiftboard_id, v.world_name
        FROM op_volunteer_roles AS vr
        JOIN op_volunteers AS v
        ON vr.shiftboard_id=v.shiftboard_id
        JOIN op_roles AS r
        ON r.role_id=vr.role_id
        WHERE r.role_id=? AND r.delete_role=false
        ORDER BY v.playa_name`,
        [roleId]
      );
      const resRoleVolunteerList = dbRoleVolunteerList.map(
        ({ playa_name, role, shiftboard_id, world_name }) => {
          return {
            playaName: playa_name,
            roleName: role,
            shiftboardId: shiftboard_id,
            worldName: world_name,
          };
        }
      );

      return res.status(200).json(resRoleVolunteerList);
    }
    // post - add role volunteer
    case "POST": {
      const { shiftboardId } = JSON.parse(req.body);
      const [dbRoleVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_volunteer_roles
        WHERE roles=? AND shiftboard_id=?`,
        [roleId, shiftboardId]
      );
      const dbRoleVolunteerFirst = dbRoleVolunteerList[0];

      // if role volunteer row exists
      // then update role volunteer row
      if (dbRoleVolunteerFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles
          SET add_role=true, delete_role=false
          WHERE roles=? AND shiftboard_id=?`,
          [roleId, shiftboardId]
        );
        // else insert role volunteer row
      } else {
        await pool.query(
          "INSERT INTO op_volunteer_roles (add_role, delete_role, roles, shiftboard_id) VALUES (true, false, ?, ?)",
          [roleId, shiftboardId]
        );
      }

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }
    // delete - remove role volunteer
    case "DELETE": {
      const { shiftboardId } = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteer_roles
        SET add_role=false, delete_role=true
        WHERE roles=? AND shiftboard_id=?`,
        [roleId, shiftboardId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
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
