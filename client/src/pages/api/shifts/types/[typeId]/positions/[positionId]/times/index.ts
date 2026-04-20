import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IResShiftTypePositionTimeItem } from "@/components/types/shifts/types";
import { formatDateName, formatTime } from "@/utils/formatDateTime";
import { pool } from "lib/database";

const shiftTypePositionTimes = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { typeId, positionId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all active times for position
      const [dbTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
          d.date,
          d.datename,
          st.end_time_text,
          st.shift_times_id,
          st.start_time_text
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_time_position AS stp
        ON stp.time_position_id=vs.time_position_id
        AND stp.position_type_id=?
        JOIN op_shift_times AS st
        ON st.shift_times_id=stp.shift_times_id
        LEFT JOIN op_dates AS d
        ON d.date_id=st.start_date_id
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        AND sn.shift_name_id=?
        WHERE vs.remove_shift=false
        ORDER BY date, st.start_time_text`,
        [positionId, typeId]
      );
      const resTimeList = dbTimeList.map(
        ({
          date,
          datename,
          end_time_text,
          shift_times_id,
          start_time_text,
        }) => {
          const resTimeItem: IResShiftTypePositionTimeItem = {
            id: shift_times_id,
            name: `${formatDateName(date, datename)}, ${formatTime(
              start_time_text,
              end_time_text
            )}`,
          };

          return resTimeItem;
        }
      );

      return res.status(200).json(resTimeList);
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

export default shiftTypePositionTimes;
