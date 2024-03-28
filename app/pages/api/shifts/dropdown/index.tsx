import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  IResPositionDropdownItem,
  IResShiftCategoryDropdownItem,
} from "src/components/types";

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift categories
      const [dbShiftCategoryList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_category, shift_category_id
        FROM op_shift_category
        ORDER BY shift_category`
      );
      const resShiftCategoryList: IResShiftCategoryDropdownItem[] =
        dbShiftCategoryList.map(({ shift_category, shift_category_id }) => ({
          shiftCategoryId: shift_category_id,
          shiftCategoryName: shift_category,
        }));
      // get all positions
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT position, position_type_id
        FROM op_position_type
        ORDER BY position`
      );
      const resPositionList: IResPositionDropdownItem[] = dbPositionList.map(
        ({ position, position_type_id }) => ({
          positionId: position_type_id,
          positionName: position,
        })
      );

      return res.status(200).json({
        positionList: resPositionList,
        shiftCategoryList: resShiftCategoryList,
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

export default shifts;
