import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IResVolunteerShiftItem } from "@/components/types/volunteers";
import { pool } from "lib/database";
import {
  shiftVolunteerCheckIn,
  shiftVolunteerRemove,
} from "pages/api/general/shiftVolunteers";

const volunteerShifts = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all volunteer shifts
      const { shiftboardId } = req.query;
      const [dbVolunteerShiftList] = await pool.query<RowDataPacket[]>(
        `SELECT
          d.datename,
          pt.position,
          sc.department,
          st.end_time_lt,
          st.start_time_lt,
          vs.noshow,
          vs.shift_position_id,
          vs.shift_times_id
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_time_position AS stp
        ON stp.time_position_id=vs.time_position_id
        JOIN op_position_type AS pt
        ON pt.position_type_id=stp.position_type_id
        JOIN op_shift_times AS st
        ON st.shift_times_id=vs.shift_times_id
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        LEFT JOIN op_dates AS d
        ON d.date=LEFT(st.start_time_lt, 10)
        WHERE vs.remove_shift=false
        AND vs.shiftboard_id=?
        ORDER BY st.start_time_lt`,
        [shiftboardId]
      );
      const resVolunteerShiftList = dbVolunteerShiftList.map(
        ({
          datename,
          department,
          end_time_lt,
          noshow,
          position,
          shift_position_id,
          shift_times_id,
          start_time_lt,
        }) => {
          const resVolunterShiftItem: IResVolunteerShiftItem = {
            dateName: datename ?? "",
            department: { name: department ?? "" },
            endTime: end_time_lt,
            noShow: noshow,
            position: { name: position },
            shiftPositionId: shift_position_id,
            startTime: start_time_lt,
            timeId: shift_times_id,
          };

          return resVolunterShiftItem;
        }
      );

      return res.status(200).json(resVolunteerShiftList);
    }

    // patch
    // --------------------
    case "PATCH": {
      // check volunteer into shift
      return shiftVolunteerCheckIn(pool, req, res);
    }

    // delete
    // --------------------
    case "DELETE": {
      // remove volunteer from shift
      return shiftVolunteerRemove(pool, req, res);
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

export default volunteerShifts;
