import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  IResPositionDropdownItem,
  IResShiftCategoryDropdownItem,
  IResShiftNameDropdownItem,
} from "src/components/types";

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift names
      const [dbShiftNameList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_name, shift_name_id
        FROM op_shift_name
        ORDER BY shift_name`
      );
      const resShiftNameList: IResShiftNameDropdownItem[] = dbShiftNameList.map(
        ({ shift_name, shift_name_id }) => ({
          shiftNameId: shift_name_id,
          shiftNameText: shift_name,
        })
      );
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
        `SELECT pt.critical, pt.end_time_offset, pt.lead, pt.position, pt.position_details, pt.position_type_id, r.role, sc.shift_category, pt.start_time_offset
        FROM op_position_type AS pt
        LEFT JOIN op_roles AS r
        ON r.role_id=pt.role_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=pt.prerequisite_id
        ORDER BY position`
      );
      const resPositionList: IResPositionDropdownItem[] = dbPositionList.map(
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
          endTimeOffset: end_time_offset,
          lead: Boolean(lead),
          positionDetails: position_details,
          role: role ?? "",
          positionId: position_type_id,
          positionName: position,
          prerequisiteShift: shift_category ?? "",
          startTimeOffset: start_time_offset,
        })
      );

      return res.status(200).json({
        positionList: resPositionList,
        shiftCategoryList: resShiftCategoryList,
        shiftNameList: resShiftNameList,
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
