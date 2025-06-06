import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { getShiftList } from "@/utils/getShiftList";
import { pool } from "lib/database";

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  const { filter } = req.query;

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      let dbShiftList = [];

      // get all training shifts
      if (filter === "trainings") {
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT
            d.datename,
            sc.department,
            sc.shift_category_id,
            sn.shift_name,
            st.end_time,
            st.shift_times_id,
            st.start_time,
            stp.slots,
            stp.time_position_id,
            vs.remove_shift,
            vs.shiftboard_id
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON sn.delete_shift=false
          AND sn.off_playa=false
          AND sn.shift_name_id=st.shift_name_id
          LEFT JOIN op_shift_category AS sc
          ON sc.delete_category=false
          AND sc.shift_category_id=sn.shift_category_id
          LEFT JOIN op_dates AS d
          ON d.date=LEFT(st.start_time, 10)
          JOIN op_shift_time_position AS stp
          ON stp.remove_time_position=false
          AND stp.shift_times_id=st.shift_times_id
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.remove_shift=false
          AND vs.time_position_id=stp.time_position_id
          WHERE st.remove_shift_time=false
          AND sc.department="Training"
          ORDER BY st.start_time, shift_times_id`
        );
      } else {
        // get all shifts
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT
            d.datename,
            sc.department,
            sc.shift_category_id,
            sn.shift_name,
            st.end_time,
            st.shift_times_id,
            st.start_time,
            stp.slots,
            stp.time_position_id,
            vs.shiftboard_id
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON sn.delete_shift=false
          AND sn.off_playa=false
          AND sn.shift_name_id=st.shift_name_id
          LEFT JOIN op_shift_category AS sc
          ON sc.delete_category=false
          AND sc.shift_category_id=sn.shift_category_id
          LEFT JOIN op_dates AS d
          ON d.date=LEFT(st.start_time, 10)
          JOIN op_shift_time_position AS stp
          ON stp.remove_time_position=false
          AND stp.shift_times_id=st.shift_times_id
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.remove_shift=false
          AND vs.time_position_id=stp.time_position_id
          WHERE st.remove_shift_time=false
          ORDER BY st.start_time, shift_times_id`
        );
      }
      const resShiftList = getShiftList(dbShiftList);

      return res.status(200).json(resShiftList);
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

export default shifts;
