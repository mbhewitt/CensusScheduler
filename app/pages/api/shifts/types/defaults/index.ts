import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  IResShiftTypeCategoryItem,
  IResShiftTypeDefaults,
  IResShiftTypeNameItem,
  IResShiftTypePositionItem,
} from "src/components/types";

const shiftTypeDefaults = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift type names
      const [dbShiftTypeNameList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_name, shift_name_id
        FROM op_shift_name
        ORDER BY shift_name`
      );
      const resNameList: IResShiftTypeNameItem[] = dbShiftTypeNameList.map(
        ({ shift_name, shift_name_id }) => ({
          id: shift_name_id,
          name: shift_name,
        })
      );
      // get all shift categories
      const [dbShiftTypeCategoryList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_category, shift_category_id
        FROM op_shift_category
        ORDER BY shift_category`
      );
      const resCategoryList: IResShiftTypeCategoryItem[] =
        dbShiftTypeCategoryList.map(
          ({ shift_category, shift_category_id }) => ({
            id: shift_category_id,
            name: shift_category,
          })
        );
      // get all shift positions
      const [dbPositionDropdownList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.critical,
          pt.end_time_offset,
          pt.lead,
          pt.position_details,
          pt.position_type_id,
          pt.position,
          pt.start_time_offset,
          r.role,
          sc.shift_category
        FROM op_position_type AS pt
        LEFT JOIN op_roles AS r
        ON r.role_id=pt.role_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=pt.prerequisite_id
        ORDER BY pt.position`
      );
      const resPositionList: IResShiftTypePositionItem[] =
        dbPositionDropdownList.map(
          ({
            critical,
            end_time_offset,
            lead,
            position,
            position_details,
            position_type_id,
            role,
            shift_category,
            start_time_offset,
          }) => ({
            critical: Boolean(critical),
            details: position_details,
            endTimeOffset: end_time_offset,
            id: position_type_id,
            lead: Boolean(lead),
            name: position,
            prerequisiteShift: shift_category ?? "",
            role: role ?? "",
            startTimeOffset: start_time_offset,
          })
        );
      const response: IResShiftTypeDefaults = {
        categoryList: resCategoryList,
        positionList: resPositionList,
        nameList: resNameList,
      };

      return res.status(200).json(response);
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

export default shiftTypeDefaults;
