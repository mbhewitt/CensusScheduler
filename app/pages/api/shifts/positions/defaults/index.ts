import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { IResShiftPositionDefaultItem } from "src/components/types";

const shiftPositionDefaults = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all positions
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          position,
          position_type_id
        FROM op_position_type
        ORDER BY position`
      );
      const resPositionList: IResShiftPositionDefaultItem[] =
        dbPositionList.map(({ position, position_type_id }) => ({
          id: position_type_id,
          name: position,
        }));
      // get all prerequisites
      const [dbPrerequisiteList] = await pool.query<RowDataPacket[]>(
        `SELECT
          shift_category,
          shift_category_id
        FROM op_shift_category
        ORDER BY shift_category`
      );
      const resPrerequisiteList: IResShiftPositionDefaultItem[] =
        dbPrerequisiteList.map(({ shift_category, shift_category_id }) => ({
          id: shift_category_id,
          name: shift_category,
        }));
      // get all roles
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT
          role,
          role_id
        FROM op_roles
        ORDER BY role`
      );
      const resRoleList: IResShiftPositionDefaultItem[] = dbRoleList.map(
        ({ role, role_id }) => ({
          id: role_id,
          name: role,
        })
      );

      return res.status(200).json({
        positionList: resPositionList,
        prerequisiteList: resPrerequisiteList,
        roleList: resRoleList,
      });
    }

    // default
    // --------------------
    // send error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default shiftPositionDefaults;
