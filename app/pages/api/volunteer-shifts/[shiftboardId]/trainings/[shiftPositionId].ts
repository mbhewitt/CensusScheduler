import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";

const volunteerShiftTrainings = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  switch (req.method) {
    // get - get all shift volunteer trainings
    case "GET": {
      const { shiftboardId, shiftPositionId } = req.query;
      const [dataDb] = await pool.query<RowDataPacket[]>(
        `WITH prereq AS (SELECT prerequisite, start_time FROM op_shifts WHERE shift_position_id=?),
        shift_cat AS (SELECT shift_category FROM op_shifts s1 JOIN op_volunteer_shifts USING (shift_position_id)
        JOIN prereq p
        ON (p.prerequisite=s1.shift_category AND s1.end_time<=p.start_time)
        WHERE shiftboard_id=? AND noshow!='Yes' AND s1.delete_shift=false)
        SELECT date, datename, end_time, free_slots, position, s1.start_time, shift_category, shift_id, shift_position_id, shift, total_slots
        FROM op_shifts s1
        JOIN prereq p
        ON (p.prerequisite=s1.shift_category AND s1.end_time<=p.start_time AND 'lead'=false)
        WHERE NOT EXISTS (SELECT * FROM shift_cat c WHERE c.shift_category=s1.shift_category)`,
        [shiftPositionId, shiftboardId]
      );
      const trainingList = dataDb.map(
        ({
          date,
          datename,
          end_time,
          free_slots,
          position,
          shift_id,
          shift_position_id,
          shift,
          start_time,
          total_slots,
        }) => ({
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
          }),
          dateName: datename,
          endTime: end_time,
          freeSlots: Number(free_slots),
          position,
          shiftId: shift_id,
          shiftPositionId: shift_position_id,
          shift,
          startTime: start_time,
          totalSlots: Number(total_slots),
        })
      );

      return res.status(200).json(trainingList);
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

export default volunteerShiftTrainings;
