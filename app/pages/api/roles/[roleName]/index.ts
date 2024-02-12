import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { roleName } = req.query;
  const [dataDbRoleVolunteerList] = await pool.query<RowDataPacket[]>(
    `SELECT vr.shiftboard_id, playa_name, world_name
    FROM op_volunteer_roles AS vr
    JOIN op_volunteers AS v
    ON vr.shiftboard_id=v.shiftboard_id
    WHERE roles=? AND delete_role=false
    ORDER BY playa_name`,
    [roleName]
  );
  const dataRoleVolunteerList = dataDbRoleVolunteerList.map(
    ({ shiftboard_id, playa_name, world_name }) => {
      return {
        playaName: playa_name,
        shiftboardId: shiftboard_id,
        worldName: world_name,
      };
    }
  );

  return res.status(200).json({
    dataRoleVolunteerList,
  });
};

export default volunteers;
