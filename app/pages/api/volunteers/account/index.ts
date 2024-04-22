import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResVolunteerAccount } from "src/components/types";
import { generateId } from "src/utils/generateId";

const account = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // --------------------
    case "POST": {
      // create volunteer account
      const {
        email,
        emergencyContact,
        location,
        passcodeCreate,
        phone,
        playaName,
        worldName,
      } = JSON.parse(req.body);
      const shiftboardIdNew = generateId(`
        SELECT shiftboard_id
        FROM op_volunteers
        WHERE shiftboard_id=?
      `);

      // insert new account row
      await pool.query<RowDataPacket[]>(
        `INSERT IGNORE INTO op_volunteers (create_volunteer, email, emergency_contact, location, passcode, phone, playa_name, shiftboard_id, world_name)
          VALUES (true, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          emergencyContact,
          location,
          passcodeCreate,
          phone,
          playaName,
          shiftboardIdNew,
          worldName,
        ]
      );

      const resAccount: IResVolunteerAccount = {
        email,
        emergencyContact,
        isCreated: true,
        location,
        notes: "",
        phone,
        playaName,
        roleList: [],
        shiftboardId: shiftboardIdNew,
        worldName,
      };

      return res.status(201).json(resAccount);
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

export default account;
