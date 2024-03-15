import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { getShiftList } from "src/utils/getShiftList";

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  const { filter } = req.query;

  switch (req.method) {
    // get
    case "GET": {
      let dbShiftList = [];

      // get all training shifts
      if (filter === "trainings") {
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT sc.category, sc.shift_category_id, st.date, d.datename, st.end_time, sp.position_type_id, sn.shift_name, st.shift_times_id, vs.shiftboard_id, st.start_time, sp.total_slots, st.year, vs.remove_shift
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON sn.shift_name_id=st.shift_name_id
          AND sn.delete_shift=false AND sn.off_playa=false
          LEFT JOIN op_shift_category AS sc
          ON sc.shift_category_id=sn.shift_category_id
          AND sc.category="Training"
          LEFT JOIN op_dates AS d
          ON d.date=st.date
          JOIN op_shift_position AS sp
          ON sp.shift_name_id=sn.shift_name_id
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.shift_position_id=sp.shift_position_id
          AND vs.remove_shift=false
          AND vs.shift_times_id=st.shift_times_id
          WHERE st.remove_shift_time=false
          ORDER BY st.start_time`
        );
      } else {
        // get all shifts
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT sc.category, sc.shift_category_id, st.date, d.datename, st.end_time, sp.position_type_id, sn.shift_name, st.shift_times_id, vs.shiftboard_id, st.start_time, sp.total_slots, st.year, vs.remove_shift
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON sn.shift_name_id=st.shift_name_id
          AND sn.delete_shift=false AND sn.off_playa=false
          LEFT JOIN op_shift_category AS sc
          ON sc.shift_category_id=sn.shift_category_id
          LEFT JOIN op_dates AS d
          ON d.date=st.date
          JOIN op_shift_position AS sp
          ON sp.shift_name_id=sn.shift_name_id
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.shift_position_id=sp.shift_position_id
          AND vs.remove_shift=false
          AND vs.shift_times_id=st.shift_times_id
          WHERE st.remove_shift_time=false
          ORDER BY st.start_time`
        );
      }
      const resShiftList = getShiftList(dbShiftList);

      return res.status(200).json(resShiftList);
    }
    // default - send an error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default shifts;
