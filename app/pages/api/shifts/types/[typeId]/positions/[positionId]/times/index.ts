import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { IResShiftTypePositionTimeItem } from "src/components/types/shifts/types";
import { formatDateName, formatTime } from "src/utils/formatDateTime";

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
          st.date, 
          st.end_time,
          st.shift_times_id,
          st.start_time
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_times AS st
        ON st.shift_times_id=vs.shift_times_id
        LEFT JOIN op_dates AS d
        ON d.date=st.date
        JOIN op_shift_position AS sp
        ON sp.shift_position_id=vs.shift_position_id
        AND sp.position_type_id=?
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        AND sn.shift_name_id=?
        WHERE vs.remove_shift=false
        ORDER BY st.start_time`,
        [positionId, typeId]
      );
      const resTimeList = dbTimeList.map(
        ({ date, datename, end_time, shift_times_id, start_time }) => {
          const resTimeItem: IResShiftTypePositionTimeItem = {
            id: shift_times_id,
            name: `${formatDateName(date, datename)}, ${formatTime(
              start_time,
              end_time
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
