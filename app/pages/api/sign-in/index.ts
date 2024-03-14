import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResVolunteerAccount } from "src/components/types";

const signIn = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // check email and passcode credentials
    case "POST": {
      const { passcode, shiftboardId } = JSON.parse(req.body);
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT core_crew, email, emergency_contact, playa_name, shiftboard_id, world_name
        FROM op_volunteers
        WHERE passcode=?
        AND shiftboard_id=?`,
        [shiftboardId, passcode]
      );
      const volunteerFirst = dbVolunteerList[0];

      // if credentials do not exist
      // then send an error message
      if (!volunteerFirst) {
        return res.status(404).json({
          statusCode: 404,
          message: "Not found",
        });
      }

      // else send the volunteer
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT r.role, r.role_id
        FROM op_volunteer_roles AS vr
        JOIN op_roles AS r
        ON vr.role_id=r.role_id
        AND vr.remove_role=false
        WHERE vr.shiftboard_id=?`,
        [shiftboardId]
      );
      const resRoleList = dbRoleList.map(({ role, role_id }) => ({
        roleId: role_id,
        roleName: role,
      }));
      const resAccount: IResVolunteerAccount = {
        email: volunteerFirst.email,
        emergencyContact: volunteerFirst.emergency_contact,
        isVolunteerCreated: volunteerFirst.create_volunteer,
        location: volunteerFirst.location,
        notes: volunteerFirst.notes,
        phone: volunteerFirst.phone,
        playaName: volunteerFirst.playa_name,
        roleList: resRoleList,
        shiftboardId: volunteerFirst.shiftboard_id,
        worldName: volunteerFirst.world_name,
      };

      return res.status(200).json(resAccount);
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
