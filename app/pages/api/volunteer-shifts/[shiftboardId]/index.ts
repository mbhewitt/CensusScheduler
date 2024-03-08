import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  shiftVolunteerAdd,
  shiftVolunteerCheckIn,
  shiftVolunteerRemove,
} from "pages/api/general/shiftVolunteers";
import type { IResVolunteerShiftItem } from "src/components/types";

const volunteerShifts = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all volunteer shifts
    case "GET": {
      const { shiftboardId } = req.query;
      const [dbVolunteerShiftList] = await pool.query<RowDataPacket[]>(
        `SELECT sc.category, st.date, d.datename, st.end_time, vs.noshow, pt.position, vs.shift_position_id, vs.shift_times_id, st.start_time
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_position AS sp
        ON sp.shift_position_id=vs.shift_position_id
        JOIN op_position_type AS pt
        ON pt.position_type_id=sp.position_type_id
        JOIN op_shift_times AS st
        ON st.shift_times_id=vs.shift_times_id
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=sp.shift_name_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        LEFT JOIN op_dates AS d
        ON d.date=st.date
        WHERE vs.shiftboard_id=? AND vs.remove_shift=false
        ORDER BY st.start_time`,
        [shiftboardId]
      );
      const resVolunteerShiftList: IResVolunteerShiftItem[] =
        dbVolunteerShiftList.map(
          ({
            category,
            date,
            datename,
            end_time,
            noshow,
            position,
            shift_position_id,
            shift_times_id,
            start_time,
          }) => ({
            category: category ?? "",
            date,
            dateName: datename ?? "",
            endTime: end_time,
            noShow: noshow,
            positionName: position,
            shiftPositionId: shift_position_id,
            shiftTimesId: shift_times_id,
            startTime: start_time,
          })
        );

      return res.status(200).json(resVolunteerShiftList);
    }
    // post - add a volunteer to a shift
    case "POST": {
      return shiftVolunteerAdd(pool, req, res);
    }
    // patch - check a volunteer into a shift
    case "PATCH": {
      return shiftVolunteerCheckIn(pool, req, res);
    }
    // delete - remove a volunteer from a shift
    case "DELETE": {
      return shiftVolunteerRemove(pool, req, res);
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

export default volunteerShifts;
