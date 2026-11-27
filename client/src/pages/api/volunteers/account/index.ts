import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IResVolunteerAccount } from "@/components/types/volunteers";
import { generateNewUserShiftboardId } from "@/lib/newUserId";
import { pool } from "lib/database";

const account = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      // create volunteer account
      const { email, location, passcodeCreate, playaName, worldName } =
        JSON.parse(req.body);

      // #207: refuse a second account for the same email (case-insensitive)
      const [dbEmailList] = await pool.query<RowDataPacket[]>(
        `SELECT shiftboard_id
        FROM op_volunteers
        WHERE LOWER(email)=LOWER(?)
          AND (delete_volunteer IS NULL OR delete_volunteer=false)
        LIMIT 1`,
        [String(email ?? "").trim()]
      );
      if (dbEmailList.length > 0) {
        return res.status(409).json({
          statusCode: 409,
          message:
            "An account with this email already exists. Try signing in instead.",
        });
      }

      const shiftboardIdNew = await generateNewUserShiftboardId();

      // insert new account row
      await pool.query<RowDataPacket[]>(
        `INSERT INTO op_volunteers (
          create_volunteer,
          email,
          location,
          passcode,
          playa_name,
          shiftboard_id,
          world_name
        )
        VALUES (true, ?, ?, ?, ?, ?, ?)`,
        [email, location, passcodeCreate, playaName, shiftboardIdNew, worldName]
      );

      const resAccount: IResVolunteerAccount = {
        email,
        isCreated: true,
        location,
        notes: "",
        playaName,
        roleList: [],
        shiftboardId: shiftboardIdNew,
        worldName,
      };

      return res.status(201).json(resAccount);
    }

    // default
    // ------------------------------------------------------------
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
