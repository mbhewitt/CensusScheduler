import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  shiftVolunteerAdd,
  shiftVolunteerCheckIn,
  shiftVolunteerRemove,
} from "pages/api/general/shiftVolunteers";
import type { IDataVolunteerShiftItem } from "src/components/types";

const volunteerShifts = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all volunteer shifts
    case "GET": {
      const { shiftboardId } = req.query;
      const [dbVolunteerShiftList] = await pool.query<RowDataPacket[]>(
        `SELECT date, datename, end_time, noshow, playa_name, position, s.shift_position_id, shift_id, shift, start_time, world_name
        FROM op_shifts AS s
        JOIN op_volunteer_shifts AS vs
        ON (s.shift_position_id=vs.shift_position_id AND s.delete_shift=false AND vs.delete_shift=false)
        JOIN op_volunteers
        USING (shiftboard_id)
        WHERE shiftboard_id=?
        ORDER BY start_time`,
        [shiftboardId]
      );
      let [volunteerShiftItem] = dbVolunteerShiftList;
      let volunteerShiftList: IDataVolunteerShiftItem[] = [];

      // if a volunteer shift is found
      // then prepare volunteer shift list
      if (volunteerShiftItem) {
        volunteerShiftList = dbVolunteerShiftList.map(
          ({
            date,
            datename,
            end_time,
            noshow,
            position,
            shift,
            shift_id,
            shift_position_id,
            start_time,
          }) => ({
            date: new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            }),
            dateName: datename,
            endTime: end_time,
            noShow: noshow,
            position,
            shift,
            shiftId: shift_id,
            shiftPositionId: shift_position_id,
            startTime: start_time,
          })
        );
        // else send volunteer information
      } else {
        const [dbVolunteerShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT playa_name, world_name
          FROM op_volunteers
          WHERE shiftboard_id=?`,
          [shiftboardId]
        );

        [volunteerShiftItem] = dbVolunteerShiftList;
      }

      return res.status(200).json({
        playaName: volunteerShiftItem.playa_name,
        volunteerShiftList,
        worldName: volunteerShiftItem.world_name,
      });
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
