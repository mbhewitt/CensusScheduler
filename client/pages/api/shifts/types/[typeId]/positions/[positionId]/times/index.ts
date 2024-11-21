import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { IResShiftTypePositionTimeItem } from "@/components/types/shifts/types";
import { formatDateName, formatTime } from "@/utils/formatDateTime";
import { pool } from "lib/database";

const shiftTypePositionTimes = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { typeId, positionId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all active times for position
      const [dbTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
          d.datename,
          st.end_time_lt,
          st.shift_times_id,
          st.start_time_lt
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_times AS st
        ON st.shift_times_id=vs.shift_times_id
        LEFT JOIN op_dates AS d
        ON d.date=LEFT(st.start_time_lt, 10)
        JOIN op_shift_position AS sp
        ON sp.shift_position_id=vs.shift_position_id
        AND sp.position_type_id=?
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        AND sn.shift_name_id=?
        WHERE vs.remove_shift=false
        ORDER BY st.start_time_lt`,
        [positionId, typeId]
      );
      const resTimeList = dbTimeList.map(
        ({ datename, end_time_lt, shift_times_id, start_time_lt }) => {
          const resTimeItem: IResShiftTypePositionTimeItem = {
            id: shift_times_id,
            name: `${formatDateName(start_time_lt, datename)}, ${formatTime(
              start_time_lt,
              end_time_lt
            )}`,
          };

          return resTimeItem;
        }
      );

      return res.status(200).json(resTimeList);
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

export default shiftTypePositionTimes;
