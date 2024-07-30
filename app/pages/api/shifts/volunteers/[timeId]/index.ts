import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import {
  shiftVolunteerCheckIn,
  shiftVolunteerRemove,
} from "pages/api/general/shiftVolunteers";
import type {
  IReqShiftVolunteerItem,
  IResShiftPositionCountItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "src/components/types/shifts";

const shiftVolunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get all shift volunteers
      const { timeId } = req.query;
      const [dbShiftPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          d.datename,
          pt.position_details,
          pt.position,
          pt.prerequisite_id,
          pt.role_id,
          sn.shift_details,
          sn.shift_name,
          sp.position_type_id,
          sp.shift_position_id,
          sp.total_slots,
          st.end_time_lt,
          st.meal,
          st.notes,
          st.start_time_lt
        FROM op_shift_times AS st
        LEFT JOIN op_dates AS d
        ON d.date=LEFT(st.start_time_lt, 10)
        JOIN op_shift_name AS sn
        ON sn.delete_shift=false
        AND sn.shift_name_id=st.shift_name_id
        JOIN op_shift_position AS sp
        ON sp.remove_shift_position=false
        AND sp.shift_name_id=sn.shift_name_id
        JOIN op_position_type AS pt
        ON pt.delete_position=false
        AND pt.position_type_id=sp.position_type_id
        WHERE st.remove_shift_time=false
        AND st.shift_times_id=?
        ORDER BY pt.position`,
        [timeId]
      );
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.position,
          sp.position_type_id,
          v.playa_name,
          v.world_name,
          vs.noshow,
          vs.shift_position_id,
          vs.shift_times_id,
          vs.shiftboard_id
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_position AS sp
        ON sp.remove_shift_position=false
        AND sp.shift_position_id=vs.shift_position_id
        JOIN op_position_type AS pt
        ON pt.delete_position=false
        AND pt.position_type_id=sp.position_type_id
        JOIN op_volunteers AS v
        ON v.delete_volunteer=false
        AND v.shiftboard_id=vs.shiftboard_id
        WHERE vs.remove_shift=false
        AND vs.shift_times_id=?
        ORDER BY v.playa_name`,
        [timeId]
      );
      const [resShiftPositionFirst] = dbShiftPositionList;
      const resShiftPositionList = dbShiftPositionList.map(
        ({
          position_details,
          position_type_id,
          position,
          prerequisite_id,
          role_id,
          shift_position_id,
          total_slots,
        }) => {
          const resShiftPositionItem: IResShiftPositionCountItem = {
            filledSlots: 0,
            positionName: position,
            positionDetails: position_details,
            positionId: position_type_id,
            prerequisiteId: prerequisite_id ?? 0,
            roleRequiredId: role_id ?? 0,
            shiftPositionId: shift_position_id,
            totalSlots: total_slots,
          };

          return resShiftPositionItem;
        }
      );
      const resShiftVolunteerList = dbShiftVolunteerList.map(
        ({
          noshow,
          playa_name,
          position,
          shift_position_id,
          shift_times_id,
          shiftboard_id,
          world_name,
        }) => {
          const resShiftVolunteerItem: IResShiftVolunteerRowItem = {
            isCheckedIn: noshow,
            playaName: playa_name,
            positionName: position,
            shiftboardId: shiftboard_id,
            shiftPositionId: shift_position_id,
            timeId: shift_times_id,
            worldName: world_name,
          };
          return resShiftVolunteerItem;
        }
      );

      resShiftVolunteerList.forEach((shiftVolunteerItem) => {
        const positionFound = resShiftPositionList.find(
          (resShiftPositionItem) =>
            resShiftPositionItem.shiftPositionId ===
            shiftVolunteerItem.shiftPositionId
        );
        if (positionFound) positionFound.filledSlots += 1;
      });

      const resShiftVolunteerDetails: IResShiftVolunteerInformation = {
        dateName: resShiftPositionFirst.datename ?? "",
        details: resShiftPositionFirst.shift_details,
        endTime: resShiftPositionFirst.end_time_lt,
        meal: resShiftPositionFirst.meal,
        notes: resShiftPositionFirst.notes,
        positionList: resShiftPositionList,
        startTime: resShiftPositionFirst.start_time_lt,
        type: resShiftPositionFirst.shift_name,
        volunteerList: resShiftVolunteerList,
      };

      return res.status(200).json(resShiftVolunteerDetails);
    }

    // post
    // --------------------
    case "POST": {
      // add volunteer to shift
      const {
        id: timeId,
        noShow,
        shiftboardId,
        shiftPositionId,
      }: IReqShiftVolunteerItem = JSON.parse(req.body);
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_volunteer_shifts
        WHERE shift_position_id=?
        AND shift_times_id=?
        AND shiftboard_id=?`,
        [shiftPositionId, timeId, shiftboardId]
      );
      const dbShiftVolunteerFirst = dbShiftVolunteerList[0];

      // if volunteer exists in shift already
      // then update add_shift and remove_shift fields
      if (dbShiftVolunteerFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_shifts
          SET
            noshow=?,
            add_shift=true,
            remove_shift=false
          WHERE shift_position_id=?
          AND shift_times_id=?
          AND shiftboard_id=?`,
          [noShow, shiftPositionId, timeId, shiftboardId]
        );
        // else insert them into the table
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_shifts (
            add_shift,
            noshow,
            shift_position_id,
            shift_times_id,
            shiftboard_id
          )
          VALUES (true, ?, ?, ?, ?)`,
          [noShow, shiftPositionId, timeId, shiftboardId]
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
