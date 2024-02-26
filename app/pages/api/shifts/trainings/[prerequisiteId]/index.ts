import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

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
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        LEFT JOIN op_dates AS d
        ON d.date=st.date
        JOIN op_shift_position AS sp
        ON sp.shift_name_id=sn.shift_name_id
        LEFT JOIN op_volunteer_shifts AS vs
        ON vs.shift_position_id=sp.shift_position_id AND vs.shift_times_id=st.shift_times_id
        WHERE sn.delete_shift=false AND sn.off_playa=false AND vs.remove_shift=false AND st.remove_shift_time=false AND sc.shift_category_id=?
        ORDER BY st.start_time`,
        [prerequisiteId]
      );

      // const { shiftboardId, shiftPositionId } = req.query;
      // const [dbTrainingList] = await pool.query<RowDataPacket[]>(
      //   `WITH prereq AS (SELECT prerequisite, start_time FROM op_shifts WHERE shift_position_id=?),
      //   shift_cat AS (SELECT shift_category FROM op_shifts s1 JOIN op_volunteer_shifts USING (shift_position_id)
      //   JOIN prereq p
      //   ON (p.prerequisite=s1.shift_category AND s1.end_time<=p.start_time)
      //   WHERE shiftboard_id=? AND noshow!='Yes' AND s1.delete_shift=false)
      //   SELECT date, datename, end_time, free_slots, position, s1.start_time, shift_category, shift_id, shift_position_id, shift, total_slots
      //   FROM op_shifts s1
      //   JOIN prereq p
      //   ON (p.prerequisite=s1.shift_category AND s1.end_time<=p.start_time AND 'lead'=false)
      //   WHERE NOT EXISTS (SELECT * FROM shift_cat c WHERE c.shift_category=s1.shift_category)`,
      //   [shiftPositionId, shiftboardId]
      // );
      // const resTrainingList = dbTrainingList.map(
      //   ({
      //     date,
      //     datename,
      //     end_time,
      //     free_slots,
      //     position,
      //     shift_id,
      //     shift_position_id,
      //     shift,
      //     start_time,
      //     total_slots,
      //   }) => ({
      //     date: new Date(date).toLocaleDateString("en-US", {
      //       month: "short",
      //       day: "2-digit",
      //     }),
      //     dateName: datename,
      //     endTime: end_time,
      //     freeSlots: Number(free_slots),
      //     position,
      //     shiftId: shift_id,
      //     shiftPositionId: shift_position_id,
      //     shift,
      //     startTime: start_time,
      //     totalSlots: Number(total_slots),
      //   })
      // );

      // return res.status(200).json(resTrainingList);
      return res.status(200).json(dbTrainingList);
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
