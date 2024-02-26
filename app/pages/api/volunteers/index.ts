import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { IVolunteerShiftCountItem } from "src/components/types";

interface IVolunteerAccount {
  email: string;
  isCoreCrew: boolean;
  playaName: string;
  shiftboardId: number;
  worldName: string;
}
interface IDbVolunteerItem {
  noshow: string;
  notes: null | string;
  playa_name: string;
  shiftboard_id: number;
  world_name: string;
}

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all volunteers and their shift counts WIP
    case "GET": {
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT noshow, notes, playa_name, v.shiftboard_id, world_name
        FROM op_volunteers AS v
        LEFT JOIN op_volunteer_shifts AS vs
        ON v.shiftboard_id = vs.shiftboard_id
        ORDER BY playa_name, world_name`
      );
      const resVolunteerList = dbVolunteerList.reduce(
        (
          rowList: IVolunteerShiftCountItem[],
          {
            noshow,
            notes,
            playa_name,
            shiftboard_id,
            world_name,
          }: IDbVolunteerItem | RowDataPacket
        ) => {
          const rowListLast = rowList[rowList.length - 1];

          if (rowListLast && rowListLast.shiftboardId === shiftboard_id) {
            switch (noshow) {
              case "Yes":
                rowListLast.noShowCount += 1;
                break;
              case "":
                rowListLast.attendedCount += 1;
                break;
              case "X":
                rowListLast.remainingCount += 1;
                break;
              default:
            }

            return rowList;
          }

          const rowItemNew = {
            attendedCount: 0,
            isNotes: Boolean(notes),
            noShowCount: 0,
            playaName: playa_name,
            remainingCount: 0,
            shiftboardId: shiftboard_id,
            worldName: world_name,
          };

          return [...rowList, rowItemNew];
        },
        []
      );

      return res.status(200).json(resVolunteerList);
    }
    // create volunteer account
    case "POST": {
      const {
        email,
        emergencyContact,
        location,
        passcodeCreate,
        phone,
        playaName,
        worldName,
      } = JSON.parse(req.body);
      const generateShiftboardId = () =>
        Math.floor(Math.random() * 1000000 + 1);
      const insertAccount = async (): Promise<IVolunteerAccount> => {
        const shiftboardIdRandom = generateShiftboardId();
        const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
          `SELECT shiftboard_id
          FROM op_volunteers
          WHERE shiftboard_id=${shiftboardIdRandom}`
        );

        // if shiftboard ID exists already
        // then execute function recursively
        if (dbVolunteerList.length > 0) {
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
            shiftboardIdRandom,
            worldName,
          ]
        );

        return {
          email,
          isCoreCrew: false,
          playaName,
          shiftboardId: shiftboardIdRandom,
          worldName,
        };
      };
      const resAccount = await insertAccount();

      return res.status(200).json(resAccount);
    }
    // patch
    case "PATCH": {
      const { update } = req.query;

      switch (update) {
        // reset volunteer passcode
        case "passcode": {
          const { passcode, shiftboardId } = JSON.parse(req.body);

          await pool.query<RowDataPacket[]>(
            `UPDATE op_volunteers
            SET passcode=?
            WHERE shiftboard_id=?`,
            [passcode, shiftboardId]
          );

          break;
        }

        // update volunteer profile
        default: {
          const {
            email,
            emergencyContact,
            location,
            notes,
            phone,
            playaName,
            shiftboardId,
            worldName,
          } = JSON.parse(req.body);

          await pool.query<RowDataPacket[]>(
            `UPDATE op_volunteers
            SET email=?, emergency_contact=?, location=?, needs_update=true, notes=?, phone=?, playa_name=?, world_name=?
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
        }
      }

      return res.status(200).json({
        statusCode: 200,
        message: "Success",
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

export default volunteers;
