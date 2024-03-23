import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResRoleVolunteerItem } from "src/components/types";

const roleVolunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all role volunteers
      const [dbRoleVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT v.playa_name, r.role, r.role_id, vr.shiftboard_id, v.world_name
        FROM op_volunteer_roles AS vr
        JOIN op_volunteers AS v
        ON vr.shiftboard_id=v.shiftboard_id
        JOIN op_roles AS r
        ON r.role_id=vr.role_id
        AND r.role_id=?
        WHERE vr.remove_role=false
        ORDER BY v.playa_name`,
        [roleId]
      );
      const resRoleVolunteerList: IResRoleVolunteerItem[] =
        dbRoleVolunteerList.map(
          ({ playa_name, role, role_id, shiftboard_id, world_name }) => {
            return {
              playaName: playa_name,
              roleId: role_id,
              roleName: role,
              shiftboardId: shiftboard_id,
              worldName: world_name,
            };
          }
        );

      return res.status(200).json(resRoleVolunteerList);
    }

    // post
    // --------------------
    case "POST": {
      // add role volunteer
      const { shiftboardId } = JSON.parse(req.body);
      const [dbRoleVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT role_id
        FROM op_volunteer_roles
        WHERE role_id=?
        AND shiftboard_id=?`,
        [roleId, shiftboardId]
      );
      const dbRoleVolunteerFirst = dbRoleVolunteerList[0];

      // if role volunteer row exists
      // then update role volunteer row
      if (dbRoleVolunteerFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_roles
          SET add_role=true, remove_role=false
          WHERE roles=?
          AND shiftboard_id=?`,
          [roleId, shiftboardId]
        );
        // else insert role volunteer row
      } else {
        await pool.query(
          `INSERT INTO op_volunteer_roles (add_role, remove_role, role_id, shiftboard_id)
          VALUES (true, false, ?, ?)`,
          [roleId, shiftboardId]
        );
      }

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // --------------------
    case "DELETE": {
      // remove role volunteer
      const shiftboardId = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteer_roles
        SET add_role=false, remove_role=true
        WHERE role_id=? AND shiftboard_id=?`,
        [roleId, shiftboardId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
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

export default roleVolunteers;
