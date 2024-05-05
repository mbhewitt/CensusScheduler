import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResVolunteerAccount } from "src/components/types";

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  const { shiftboardId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get volunteer account
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT
          r.role,
          r.role_id
        FROM op_roles as r
        JOIN op_volunteer_roles AS vr
        ON r.role_id=vr.role_id
        AND vr.remove_role=false
        AND vr.shiftboard_id=?`,
        [shiftboardId]
      );
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          create_volunteer,
          email,
          emergency_contact,
          location,
          notes,
          phone,
          playa_name,
          shiftboard_id,
          world_name
        FROM op_volunteers
        WHERE delete_volunteer=false
        AND shiftboard_id=?
        ORDER BY playa_name`,
        [shiftboardId]
      );
      const resRoleList = dbRoleList.map(({ role, role_id }) => ({
        id: role_id,
        name: role,
      }));
      const dbVolunteerFirst = dbVolunteerList[0];
      const resVolunteerItem: IResVolunteerAccount = {
        email: dbVolunteerFirst.email ?? "",
        emergencyContact: dbVolunteerFirst.emergency_contact ?? "",
        isCreated: Boolean(dbVolunteerFirst.create_volunteer),
        location: dbVolunteerFirst.location ?? "",
        notes: dbVolunteerFirst.notes ?? "",
        phone: dbVolunteerFirst.phone ?? "",
        playaName: dbVolunteerFirst.playa_name ?? "",
        shiftboardId: dbVolunteerFirst.shiftboard_id ?? 0,
        roleList: resRoleList,
        worldName: dbVolunteerFirst.world_name ?? "",
      };

      return res.status(200).json(resVolunteerItem);
    }

    // patch
    // --------------------
    case "PATCH": {
      // update volunteer account
      const {
        email,
        emergencyContact,
        location,
        notes,
        phone,
        playaName,
        worldName,
      } = JSON.parse(req.body);

      await pool.query<RowDataPacket[]>(
        `UPDATE op_volunteers
        SET
          email=?,
          emergency_contact=?,
          location=?,
          notes=?,
          phone=?,
          playa_name=?,
          update_volunteer=true,
          world_name=?
        WHERE shiftboard_id=?`,
        [
          email,
          emergencyContact,
          location,
          notes,
          phone,
          playaName,
          worldName,
          shiftboardId,
        ]
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

export default volunteers;
