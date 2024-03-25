import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { getShiftList } from "src/utils/getShiftList";

const shiftTrainings = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift volunteer trainings
      const { prerequisiteId } = req.query;
      const [dbTrainingList] = await pool.query<RowDataPacket[]>(
        `SELECT sc.category, sc.shift_category_id, st.date, d.datename, st.end_time, sp.position_type_id, sn.shift_name, st.shift_times_id, vs.shiftboard_id, st.start_time, sp.total_slots, st.year, vs.remove_shift
        FROM op_shift_times AS st
        JOIN op_shift_name AS sn
        ON sn.delete_shift=false
        AND sn.off_playa=false
        AND st.shift_name_id=sn.shift_name_id
        LEFT JOIN op_shift_category AS sc
        ON sc.delete_category=false
        AND sc.shift_category_id=sn.shift_category_id
        AND sc.shift_category_id=?
        LEFT JOIN op_dates AS d
        ON d.date=st.date
        JOIN op_shift_position AS sp
        ON sp.remove_shift_position=false
        AND sp.shift_name_id=sn.shift_name_id
        LEFT JOIN op_volunteer_shifts AS vs
        ON vs.remove_shift=false
        AND vs.shift_position_id=sp.shift_position_id
        AND vs.shift_times_id=st.shift_times_id
        WHERE st.remove_shift_time=false
        ORDER BY st.start_time`,
        [prerequisiteId]
      );
      const resShiftList = getShiftList(dbTrainingList);

      return res.status(200).json(resShiftList);
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

export default shiftTrainings;
