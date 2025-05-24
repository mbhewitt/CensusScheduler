import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IResVolunteerShiftCountItem } from "@/components/types/volunteers";
import { pool } from "lib/database";

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all volunteers and their shift counts
      const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          v.notes,
          v.playa_name,
          v.shiftboard_id,
          v.world_name,
          vs.noshow
        FROM op_volunteers AS v
        LEFT JOIN op_volunteer_shifts AS vs
        ON vs.shiftboard_id=v.shiftboard_id
        ORDER BY
          v.playa_name COLLATE utf8mb4_general_ci,
          v.world_name COLLATE utf8mb4_general_ci`
      );
      const resVolunteerList: IResVolunteerShiftCountItem[] = [];

      dbVolunteerList.forEach(
        ({ noshow, notes, playa_name, shiftboard_id, world_name }) => {
          const resVolunteerLast = resVolunteerList.at(-1);

          // if volunteer in last row is same as this row
          // then add shift count
          if (
            resVolunteerLast &&
            resVolunteerLast.shiftboardId === shiftboard_id
          ) {
            switch (noshow) {
              case "":
                resVolunteerLast.attendedCount += 1;
                break;
              case "Yes":
                resVolunteerLast.noShowCount += 1;
                break;
              case "X":
                resVolunteerLast.remainingCount += 1;
                break;
              default:
            }
            // else add new shift count item
          } else {
            const resVolunteerNew = {
              attendedCount: 0,
              isNotes: Boolean(notes),
              noShowCount: 0,
              playaName: playa_name,
              remainingCount: 0,
              shiftboardId: shiftboard_id,
              worldName: world_name,
            };

            switch (noshow) {
              case "":
                resVolunteerNew.attendedCount += 1;
                break;
              case "Yes":
                resVolunteerNew.noShowCount += 1;
                break;
              case "X":
                resVolunteerNew.remainingCount += 1;
                break;
              default:
            }

            resVolunteerList.push(resVolunteerNew);
          }
        }
      );

      return res.status(200).json(resVolunteerList);
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

export default volunteers;
