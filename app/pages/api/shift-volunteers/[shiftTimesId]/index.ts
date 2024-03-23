import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  shiftVolunteerCheckIn,
  shiftVolunteerRemove,
} from "pages/api/general/shiftVolunteers";
import type {
  IResPositionItem,
  IResShiftVolunteerItem,
} from "src/components/types";

const shiftVolunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift volunteers
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
        WHERE st.remove_shift_time=false
        AND st.shift_times_id=?`,
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
        WHERE vs.remove_shift=false
        AND vs.shift_times_id=?
        ORDER BY v.playa_name`,
        [shiftTimesId]
      );
      const resShiftPositionFirst = dbShiftPositionList[0];
      const resShiftPositionList: IResPositionItem[] = dbShiftPositionList.map(
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
          positionName: position,
          positionDetails: position_details,
          positionTypeId: position_type_id,
          prerequisiteId: prerequisite_id ?? 0,
          roleRequiredId: role_id ?? 0,
          shiftPositionId: shift_position_id,
          totalSlots: total_slots,
        })
      );
      const resShiftVolunteerList: IResShiftVolunteerItem[] =
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
            positionName: position,
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

    // post
    // --------------------
    case "POST": {
      // add volunteer to shift
      const { noShow, shiftboardId, shiftPositionId, shiftTimesId } =
        JSON.parse(req.body);
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_volunteer_shifts
        WHERE shift_position_id=? AND shift_times_id=? AND shiftboard_id=?`,
        [shiftPositionId, shiftTimesId, shiftboardId]
      );
      const dbShiftVolunteerFirst = dbShiftVolunteerList[0];

      // if volunteer exists in shift already
      // then update add_shift and remove_shift fields
      if (dbShiftVolunteerFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_shifts
          SET noshow=?, add_shift=true, remove_shift=false
          WHERE shift_position_id=? AND shift_times_id=? AND shiftboard_id=?`,
          [noShow, shiftPositionId, shiftTimesId, shiftboardId]
        );
      } else {
        // else insert them into the table
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_shifts (add_shift, noshow, shift_position_id, shift_times_id, shiftboard_id)
          VALUES (true, ?, ?, ?, ?)`,
          [noShow, shiftPositionId, shiftTimesId, shiftboardId]
        );
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
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

export default shiftVolunteers;
