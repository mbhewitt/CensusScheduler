import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResVolunteerAccount } from "src/components/types";
import { idGenerate } from "src/utils/idGenerate";

const account = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post - create volunteer account
    case "POST": {
      const {
        email,
        emergencyContact,
        location,
        passcodeCreate,
        phone,
        playaName,
        worldName,
      } = req.body;
      const insertAccount = async (): Promise<IResVolunteerAccount> => {
        const shiftboardIdNew = idGenerate();
        const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
          `SELECT shiftboard_id
          FROM op_volunteers
          WHERE shiftboard_id=?`,
          [shiftboardIdNew]
        );
        const dbVolunteerFirst = dbVolunteerList[0];

        // if shiftboard ID exists already
        // then execute function recursively
        if (dbVolunteerFirst) {
          return insertAccount();
        }
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

        return {
          email,
          emergencyContact,
          isVolunteerCreated: true,
          location,
          notes: "",
          phone,
          playaName,
          roleList: [],
          shiftboardId: shiftboardIdNew,
          worldName,
        };
      };
      const resAccount = await insertAccount();

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

export default account;
