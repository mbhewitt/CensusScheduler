import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  IResShiftPositionPrerequisiteItem,
  IResShiftPositionRoleItem,
  IResShiftPositionRowItem,
} from "@/components/types/shifts/positions";
import { pool } from "lib/database";

const shiftPositionDefaults = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all positions
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          position,
          position_type_id
        FROM op_position_type
        ORDER BY position`
      );
      const resPositionList = dbPositionList.map(
        ({ position, position_type_id }) => {
          const resPositionItem: IResShiftPositionRowItem = {
            id: position_type_id,
            name: position,
          };

          return resPositionItem;
        }
      );
      // get all prerequisites
      const [dbPrerequisiteList] = await pool.query<RowDataPacket[]>(
        `SELECT
          shift_category,
          shift_category_id
        FROM op_shift_category
        ORDER BY shift_category`
      );
      const resPrerequisiteList = dbPrerequisiteList.map(
        ({ shift_category, shift_category_id }) => {
          const resPrerequisiteItem: IResShiftPositionPrerequisiteItem = {
            id: shift_category_id,
            name: shift_category,
          };

          return resPrerequisiteItem;
        }
      );
      // get all roles
      const [dbRoleList] = await pool.query<RowDataPacket[]>(
        `SELECT
          role,
          role_id
        FROM op_roles
        WHERE display=true
        ORDER BY role`
      );
      const resRoleList = dbRoleList.map(({ role, role_id }) => {
        const resRoleItem: IResShiftPositionRoleItem = {
          id: role_id,
          name: role,
        };

        return resRoleItem;
      });

      return res.status(200).json({
        positionList: resPositionList,
        prerequisiteList: resPrerequisiteList,
        roleList: resRoleList,
      });
    }

    // default
    // ------------------------------------------------------------
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
