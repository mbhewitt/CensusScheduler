import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IResShiftTypeItem } from "src/components/types";

const shiftTypes = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift types
      const [dbShiftTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_name, shift_name_id
        FROM op_shift_name
        WHERE delete_shift=false
        ORDER BY shift_name`
      );
      const resShiftTypeList: IResShiftTypeItem[] = dbShiftTypeList.map(
        ({ shift_name, shift_name_id }) => {
          return { shiftTypeId: shift_name_id, shiftTypeName: shift_name };
        }
      );

      return res.status(200).json(resShiftTypeList);
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

export default shiftTypes;
