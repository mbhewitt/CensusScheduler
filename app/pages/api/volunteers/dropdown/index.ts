import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type {
  IResVolunteerDropdownItem,
  IResVolunteerRoleItem,
} from "src/components/types";
import { CORE_CREW_ID } from "src/constants";

interface IDbVolunteerItem {
  playa_name: string;
  role: string;
  role_id: number;
  shiftboard_id: number;
  world_name: string;
}

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    case "GET": {
      const { filter } = req.query;
      let dbVolunteerList = [];

      switch (filter) {
        // get core volunteers
        case "core": {
          [dbVolunteerList] = await pool.query<RowDataPacket[]>(
            `SELECT v.playa_name, r.role, r.role_id, v.shiftboard_id, v.world_name
            FROM op_volunteers AS v
            JOIN op_volunteer_roles AS vr
            ON vr.shiftboard_id=v.shiftboard_id
            JOIN op_roles AS r
            ON r.role_id=vr.role_id
            AND r.role_id=?
            ORDER BY playa_name`,
            [CORE_CREW_ID]
          );

          break;
        }
        // get all volunteers
        default: {
          [dbVolunteerList] = await pool.query<RowDataPacket[]>(
            `SELECT v.playa_name, r.role, r.role_id, v.shiftboard_id, v.world_name
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

      const resVolunteerList = dbVolunteerList.reduce(
        (
          rowList: IResVolunteerDropdownItem[],
          {
            playa_name,
            role,
            role_id,
            shiftboard_id,
            world_name,
          }: IDbVolunteerItem | RowDataPacket
        ) => {
          const rowListLast = rowList[rowList.length - 1];

          if (rowListLast && rowListLast.shiftboardId === shiftboard_id) {
            rowListLast.roleList.push({
              roleId: role_id,
              roleName: role,
            });

            return rowList;
          }

          const rowItemNew = {
            playaName: playa_name,
            roleList: [] as IResVolunteerRoleItem[],
            shiftboardId: shiftboard_id,
            worldName: world_name ?? "",
          };

          if (role_id) {
            rowItemNew.roleList.push({
              roleId: role_id,
              roleName: role,
            });
          }

          return [...rowList, rowItemNew];
        },
        []
      );

      return res.status(200).json(resVolunteerList);
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
