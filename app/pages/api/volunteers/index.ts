import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResVolunteerShiftCountItem } from "src/components/types";

interface IDbVolunteerItem {
  noshow: string;
  notes: null | string;
  playa_name: string;
  shiftboard_id: number;
  world_name: string;
}

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all volunteers and their shift counts WIP
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT noshow, notes, playa_name, v.shiftboard_id, world_name
        FROM op_volunteers AS v
        LEFT JOIN op_volunteer_shifts AS vs
        ON vs.shiftboard_id=v.shiftboard_id
        ORDER BY playa_name, world_name`
      );
      const resVolunteerList = dbVolunteerList.reduce(
        (
          rowList: IResVolunteerShiftCountItem[],
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
