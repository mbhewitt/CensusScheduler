import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { getShiftList } from "src/utils/getShiftList";

const shiftTrainings = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all shift volunteer trainings
    case "GET": {
      const { prerequisiteId } = req.query;
      const [dbTrainingList] = await pool.query<RowDataPacket[]>(
        `SELECT sc.category, sc.shift_category_id, st.date, d.datename, st.end_time, sp.position_type_id, sn.shift_name, st.shift_times_id, vs.shiftboard_id, st.start_time, sp.total_slots, st.year, vs.remove_shift
        FROM op_shift_times AS st
        JOIN op_shift_name AS sn
        ON st.shift_name_id=sn.shift_name_id
        AND sn.delete_shift=false
        AND sn.off_playa=false
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        AND sc.shift_category_id=?
        LEFT JOIN op_dates AS d
        ON d.date=st.date
        JOIN op_shift_position AS sp
        ON sp.shift_name_id=sn.shift_name_id
        LEFT JOIN op_volunteer_shifts AS vs
        ON vs.shift_position_id=sp.shift_position_id AND vs.shift_times_id=st.shift_times_id
        AND vs.remove_shift=false
        WHERE st.remove_shift_time=false
        ORDER BY st.start_time`,
        [prerequisiteId]
      );
      const resShiftList = getShiftList(dbTrainingList);

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

export default shiftTrainings;
