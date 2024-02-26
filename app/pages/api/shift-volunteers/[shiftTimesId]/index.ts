import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  shiftVolunteerAdd,
  shiftVolunteerCheckIn,
  shiftVolunteerRemove,
} from "pages/api/general/shiftVolunteers";
import type { IPositionItem, IShiftVolunteerItem } from "src/components/types";

const shiftVolunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get - get all shift volunteers
    case "GET": {
      const { shiftTimesId } = req.query;
      const [dbShiftPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT st.date, d.datename, st.end_time, st.notes, pt.position, pt.position_details, sp.position_type_id, pt.prerequisite_id, pt.role_id, sn.shift_name, sp.shift_position_id, st.start_time, sp.total_slots, st.year
        FROM op_shift_times AS st
        LEFT JOIN op_dates AS d
        ON d.date=st.date
        JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id
        JOIN op_shift_position AS sp
        ON sp.shift_name_id=sn.shift_name_id
        JOIN op_position_type AS pt
        ON pt.position_type_id=sp.position_type_id
        WHERE st.shift_times_id=? AND st.remove_shift_time=false`,
        [shiftTimesId]
      );
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT vs.noshow, v.playa_name, pt.position, sp.position_type_id, vs.shift_position_id, vs.shift_times_id, vs.shiftboard_id, v.world_name
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_position AS sp
        ON sp.shift_position_id=vs.shift_position_id
        JOIN op_position_type AS pt
        ON pt.position_type_id=sp.position_type_id
        JOIN op_volunteers AS v
        ON v.shiftboard_id=vs.shiftboard_id
        WHERE vs.shift_times_id=? AND vs.remove_shift=false
        ORDER BY v.playa_name`,
        [shiftTimesId]
      );
      const resShiftPositionFirst = dbShiftPositionList[0];
      const resShiftPositionList: IPositionItem[] = dbShiftPositionList.map(
        ({
          position_details,
          position_type_id,
          position,
          prerequisite_id,
          role_id,
          shift_position_id,
          total_slots,
        }) => ({
          filledSlots: 0,
          position,
          positionDetails: position_details,
          positionTypeId: position_type_id,
          prerequisiteId: prerequisite_id ?? 0,
          roleRequiredId: role_id ?? 0,
          shiftPositionId: shift_position_id,
          totalSlots: total_slots,
        })
      );
      const resShiftVolunteerList: IShiftVolunteerItem[] =
        dbShiftVolunteerList.map(
          ({
            noshow,
            playa_name,
            position,
            shift_position_id,
            shift_times_id,
            shiftboard_id,
            world_name,
          }) => ({
            noShow: noshow,
            playaName: playa_name,
            position,
            shiftboardId: shiftboard_id,
            shiftPositionId: shift_position_id,
            shiftTimesId: shift_times_id,
            worldName: world_name,
          })
        );

      resShiftVolunteerList.forEach((shiftVolunteerItem) => {
        const positionFound = resShiftPositionList.find(
          (resShiftPositionItem) =>
            resShiftPositionItem.shiftPositionId ===
            shiftVolunteerItem.shiftPositionId
        );
        if (positionFound) positionFound.filledSlots += 1;
      });

      return res.status(200).json({
        date: resShiftPositionFirst.date,
        dateName: resShiftPositionFirst.datename ?? "",
        endTime: resShiftPositionFirst.end_time,
        shiftName: resShiftPositionFirst.shift_name,
        shiftPositionList: resShiftPositionList,
        shiftVolunteerList: resShiftVolunteerList,
        startTime: resShiftPositionFirst.start_time,
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

export default shiftVolunteers;
