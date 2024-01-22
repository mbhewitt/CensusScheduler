import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { BEHAVIORAL_STANDARDS_TEXT } from "src/constants";

const signIn = async (req: NextApiRequest, res: NextApiResponse) => {
  const { passcode, shiftboardId } = JSON.parse(req.body);

  switch (req.method) {
    // check email and passcode credentials
    case "POST": {
      const [dataDbVolunteerItem] = await pool.query<RowDataPacket[]>(
        `SELECT core_crew, email, playa_name, shiftboard_id, world_name
        FROM op_volunteers
        WHERE shiftboard_id=? AND passcode=?`,
        [shiftboardId, passcode]
      );
      const volunteerFirst = dataDbVolunteerItem[0];

      // if credentials do not exist
      // then send an error message
      if (dataDbVolunteerItem.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "Not found",
        });
      }

      const [dataDbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT roles
        FROM op_volunteer_roles
        WHERE shiftboard_id=? AND delete_role=false
        ORDER BY roles`,
        [shiftboardId]
      );
      const isBehavioralStandardsSigned = dataDbRoleList
        .map(({ roles }) => roles)
        .includes(BEHAVIORAL_STANDARDS_TEXT);

      // else send the volunteer
      return res.status(200).json({
        email: volunteerFirst.email,
        isBehavioralStandardsSigned,
        isCoreCrew: Boolean(volunteerFirst.core_crew),
        playaName: volunteerFirst.playa_name,
        shiftboardId: volunteerFirst.shiftboard_id,
        worldName: volunteerFirst.world_name,
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

export default signIn;
