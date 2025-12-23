import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type { IResShiftPositionTypeItem } from "@/components/types/shifts/positions";
import { pool } from "lib/database";

const shiftPositionTypes = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { positionId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all active types for position
      const [dbTypeList] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
          sn.shift_name,
          sn.shift_name_id
        FROM op_shift_name AS sn
        JOIN op_shift_times as st
        ON st.shift_name_id=sn.shift_name_id
        JOIN op_shift_time_position AS stp
        ON stp.shift_times_id=st.shift_times_id
        AND sn.delete_shift=false
        WHERE stp.position_type_id=?
        ORDER BY sn.shift_name COLLATE utf8mb4_general_ci`,
        [positionId]
      );
      const resTypeList = dbTypeList.map(({ shift_name, shift_name_id }) => {
        const resTypeItem: IResShiftPositionTypeItem = {
          id: shift_name_id,
          name: shift_name,
        };

        return resTypeItem;
      });

      return res.status(200).json(resTypeList);
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

export default shiftPositionTypes;
