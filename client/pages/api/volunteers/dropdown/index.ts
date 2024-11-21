import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IResVolunteerDefaultItem,
  IResVolunteerRoleItem,
} from "@/components/types/volunteers";
import { ROLE_CORE_CREW_ID } from "@/constants";
import { pool } from "lib/database";

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      const { filter } = req.query;
      let dbVolunteerList: RowDataPacket[] = [];

      switch (filter) {
        // get core volunteers
        case "core": {
          [dbVolunteerList] = await pool.query<RowDataPacket[]>(
            `SELECT
              r.role_id,
              r.role,
              v.playa_name,
              v.shiftboard_id,
              v.world_name
            FROM op_volunteers AS v
            JOIN op_volunteer_roles AS vr
            ON vr.shiftboard_id=v.shiftboard_id
            JOIN op_roles AS r
            ON r.role_id=vr.role_id
            AND r.role_id=?
            ORDER BY playa_name`,
            [ROLE_CORE_CREW_ID]
          );
          break;
        }
        // get all volunteers
        default: {
          [dbVolunteerList] = await pool.query<RowDataPacket[]>(
            `SELECT
              r.role_id,
              r.role,
              v.playa_name,
              v.shiftboard_id,
              v.world_name
            FROM op_volunteers AS v
            LEFT JOIN op_volunteer_roles AS vr
            ON vr.shiftboard_id=v.shiftboard_id
            LEFT JOIN op_roles AS r
            ON r.role_id=vr.role_id
            ORDER BY playa_name`
          );
          break;
        }
      }

      const resVolunteerList: IResVolunteerDefaultItem[] = [];

      dbVolunteerList.forEach(
        ({
          playa_name,
          role,
          role_id,
          shiftboard_id,
          world_name,
        }: RowDataPacket) => {
          const resVolunteerLast: IResVolunteerDefaultItem | undefined =
            resVolunteerList.at(-1);

          // if volunteer in last row is same as this row
          // then add role
          if (
            resVolunteerLast &&
            resVolunteerLast.shiftboardId === shiftboard_id
          ) {
            resVolunteerLast.roleList.push({
              id: role_id,
              name: role,
            });
            // else add new volunteer
          } else {
            const resVolunteerNew: IResVolunteerDefaultItem = {
              playaName: playa_name,
              roleList: [] as IResVolunteerRoleItem[],
              shiftboardId: shiftboard_id,
              worldName: world_name ?? "",
            };

            if (role_id) {
              resVolunteerNew.roleList.push({
                id: role_id,
                name: role,
              });
            }

            resVolunteerList.push(resVolunteerNew);
          }
        }
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
