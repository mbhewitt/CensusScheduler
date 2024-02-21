import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { BEHAVIORAL_STANDARDS_ID } from "src/constants";

const signIn = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // check email and passcode credentials
    case "POST": {
      const { passcode, shiftboardId } = JSON.parse(req.body);
      const [dbVolunteerItem] = await pool.query<RowDataPacket[]>(
        `SELECT core_crew, email, playa_name, shiftboard_id, world_name
        FROM op_volunteers
        WHERE shiftboard_id=? AND passcode=?`,
        [shiftboardId, passcode]
      );
      const volunteerFirst = dbVolunteerItem[0];

      // if credentials do not exist
      // then send an error message
      if (dbVolunteerItem.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "Not found",
        });
      }

      const [dbBehavioralStandardsSignedList] = await pool.query<
        RowDataPacket[]
      >(
        `SELECT *
        FROM op_volunteer_roles AS vr
        JOIN op_roles AS r
        ON vr.role_id=r.role_id
        WHERE vr.shiftboard_id=? AND vr.role_id=? AND vr.remove_role=false`,
        [shiftboardId, BEHAVIORAL_STANDARDS_ID]
      );
      const isBehavioralStandardsSigned =
        dbBehavioralStandardsSignedList.length > 0;

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
