import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  IResShiftTypeCategoryItem,
  IResShiftTypeItem,
  IResShiftTypePositionItem,
} from "src/components/types/shifts/types";

const shiftTypeDefaults = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all types
      const [dbTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          shift_name,
          shift_name_id
        FROM op_shift_name
        ORDER BY shift_name`
      );
      const resTypeList = dbTypeList.map(({ shift_name, shift_name_id }) => {
        const resTypeItem: IResShiftTypeItem = {
          id: shift_name_id,
          name: shift_name,
        };

        return resTypeItem;
      });
      // get all categories
      const [dbCategoryList] = await pool.query<RowDataPacket[]>(
        `SELECT
          shift_category,
          shift_category_id
        FROM op_shift_category
        ORDER BY shift_category`
      );
      const resCategoryList: IResShiftTypeCategoryItem[] = dbCategoryList.map(
        ({ shift_category, shift_category_id }) => {
          const resCategoryItem: IResShiftTypeCategoryItem = {
            id: shift_category_id,
            name: shift_category,
          };

          return resCategoryItem;
        }
      );
      // get all positions
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
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
      const resPositionList: IResShiftTypePositionItem[] = dbPositionList.map(
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
        }) => {
          const resPositionItem: IResShiftTypePositionItem = {
            critical: Boolean(critical),
            details: position_details,
            endTimeOffset: end_time_offset,
            lead: Boolean(lead),
            name: position,
            positionId: position_type_id,
            prerequisite: shift_category ?? "",
            role: role ?? "",
            startTimeOffset: start_time_offset,
          };

          return resPositionItem;
        }
      );

      return res.status(200).json({
        categoryList: resCategoryList,
        positionList: resPositionList,
        typeList: resTypeList,
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

export default shiftTypeDefaults;
