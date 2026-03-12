import { RowDataPacket } from "mysql2";
import { NextApiRequest, NextApiResponse } from "next";

import type { IResDateShiftTimeRowItem } from "@/components/types/dates/shift-times";
import { pool } from "lib/database";

const calendar = async (req: NextApiRequest, res: NextApiResponse) => {
  const { dateId } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all date shift times
      const [dbDateShiftTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          sn.shift_name,
          st.shift_times_id
        FROM op_shift_times AS st
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        WHERE st.start_date_id=?
        OR st.end_date_id=?`,
        [dateId, dateId]
      );

      const resDateShiftTimeList = dbDateShiftTimeList.map(
        ({ shift_name, shift_times_id }) => {
          const resDateShiftTimeItem: IResDateShiftTimeRowItem = {
            id: shift_times_id,
            name: shift_name,
          };

          return resDateShiftTimeItem;
        }
      );

      return res.status(200).json(resDateShiftTimeList);
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

export default calendar;
