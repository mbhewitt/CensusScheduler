import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { IResShiftTypeTimePositionItem } from "@/components/types/shifts/types";
import { pool } from "lib/database";

const shiftTypeTimePositions = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { typeId, timeId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all active positions for time
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
          pt.position,
          pt.position_type_id
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_time_position AS stp
        ON stp.shift_times_id=vs.shift_times_id
        JOIN op_position_type AS pt
        ON pt.position_type_id=stp.position_type_id
        JOIN op_shift_times AS st
        ON st.shift_times_id=vs.shift_times_id
        AND st.shift_times_id=?
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        AND sn.shift_name_id=?
        WHERE vs.remove_shift=false
        ORDER BY pt.position`,
        [timeId, typeId]
      );
      const resPositionList = dbPositionList.map(
        ({ position, position_type_id }) => {
          const resPositionItem: IResShiftTypeTimePositionItem = {
            id: position_type_id,
            name: position,
          };

          return resPositionItem;
        }
      );

      return res.status(200).json(resPositionList);
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

export default shiftTypeTimePositions;
