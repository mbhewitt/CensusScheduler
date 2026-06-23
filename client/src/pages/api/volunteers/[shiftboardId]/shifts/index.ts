import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IResVolunteerShiftItem } from "@/components/types/volunteers";
import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { isOwnerOrAdmin } from "@/lib/authz";
import {
  shiftVolunteerRemove,
  shiftVolunteerUpdate,
} from "@/components/api/shiftVolunteers";

const volunteerShifts = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const { shiftboardId } = req.query;

  if (!(await isOwnerOrAdmin(session, Number(shiftboardId)))) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }

  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all volunteer shifts
      const [dbVolunteerShiftList] = await pool.query<RowDataPacket[]>(
        `SELECT
          d.date,
          d.datename,
          pt.position,
          stp.position_type_id,
          stp.sap_points,
          sc.department,
          st.canceled,
          st.end_time,
          st.end_time_text,
          st.start_time,
          st.start_time_text,
          stp.shift_times_id,
          vs.noshow,
          vs.notes,
          vs.rating,
          vs.time_position_id
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_time_position AS stp
        ON stp.time_position_id=vs.time_position_id
        JOIN op_position_type AS pt
        ON pt.position_type_id=stp.position_type_id
        JOIN op_shift_times AS st
        ON st.shift_times_id=stp.shift_times_id
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        LEFT JOIN op_dates AS d
        ON d.date_id=st.start_date_id
        WHERE vs.remove_shift=false
        AND vs.shiftboard_id=?
        ORDER BY date, st.start_time_text`,
        [shiftboardId]
      );
      const resVolunteerShiftList = dbVolunteerShiftList.map(
        ({
          canceled,
          date,
          datename,
          department,
          end_time,
          end_time_text,
          noshow,
          notes,
          position,
          position_type_id,
          rating,
          sap_points,
          shift_times_id,
          start_time,
          start_time_text,
          time_position_id,
        }) => {
          const resVolunterShiftItem: IResVolunteerShiftItem = {
            department: {
              name: department ?? "",
            },
            shift: {
              canceled: Boolean(canceled),
              csp: Number(sap_points ?? 0),
              date: date,
              dateName: datename ?? "",
              endTime: end_time ?? end_time_text,
              positionId: position_type_id,
              positionName: position,
              startTime: start_time ?? start_time_text,
              timeId: shift_times_id,
              timePositionId: time_position_id,
            },
            volunteer: {
              noShow: noshow,
              notes: notes ?? "",
              rating,
            },
          };

          return resVolunterShiftItem;
        }
      );

      return res.status(200).json(resVolunteerShiftList);
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // update volunteer in shift
      return shiftVolunteerUpdate(pool, req, res);
    }

    // delete
    // ------------------------------------------------------------
    case "DELETE": {
      // remove volunteer from shift
      return shiftVolunteerRemove(pool, req, res, session);
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

export default withAuth(volunteerShifts);
