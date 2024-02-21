import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftboardId } = req.query;

  const [dbRoleList] = await pool.query<RowDataPacket[]>(
    `SELECT r.role
    FROM op_roles as r
    JOIN op_volunteer_roles AS vr
    ON r.role_id=vr.role_id
    WHERE vr.shiftboard_id=? AND vr.remove_role=false`,
    [shiftboardId]
  );
  const [dbVolunteerItem] = await pool.query<RowDataPacket[]>(
    `SELECT create_volunteer, email, emergency_contact, location, notes, phone, playa_name, shiftboard_id, world_name
    FROM op_volunteers
    WHERE shiftboard_id=?
    ORDER BY playa_name`,
    [shiftboardId]
  );

  const roleList = dbRoleList.map(({ role }) => role);
  const [resVolunteerItem] = dbVolunteerItem.map(
    ({
      create_volunteer,
      email,
      emergency_contact,
      location,
      notes,
      phone,
      playa_name,
      world_name,
    }) => ({
      email,
      emergencyContact: emergency_contact,
      isVolunteerCreated: Boolean(create_volunteer),
      location,
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
