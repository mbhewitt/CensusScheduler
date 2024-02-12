import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftboardId } = req.query;

  const [dbRoleList] = await pool.query<RowDataPacket[]>(
    `SELECT roles
    FROM op_volunteer_roles
    WHERE shiftboard_id=? AND delete_role=false
    ORDER BY roles`,
    [shiftboardId]
  );
  const [dbVolunteerItem] = await pool.query<RowDataPacket[]>(
    `SELECT email, emergency_contact, location, new_account, notes, phone, playa_name, shiftboard_id, world_name
    FROM op_volunteers
    WHERE shiftboard_id=?
    ORDER BY playa_name`,
    [shiftboardId]
  );

  const roleList = dbRoleList.map(({ roles }) => roles);
  const [resVolunteerItem] = dbVolunteerItem.map(
    ({
      email,
      emergency_contact,
      location,
      new_account,
      notes,
      phone,
      playa_name,
      world_name,
    }) => ({
      email,
      emergencyContact: emergency_contact,
      location,
      isNewAccount: Boolean(new_account),
      notes: notes ?? "",
      phone,
      playaName: playa_name,
      roleList,
      worldName: world_name,
    })
  );

  return res.status(200).json(resVolunteerItem);
};

export default volunteers;
