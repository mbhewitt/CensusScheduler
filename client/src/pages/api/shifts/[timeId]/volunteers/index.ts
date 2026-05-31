import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type {
  IReqShiftVolunteerItem,
  IResShiftPositionCountItem,
  IResShiftVolunteerInformation,
  IResShiftVolunteerRowItem,
} from "@/components/types/shifts";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";
import { notifyAssignment } from "@/components/api/assignmentNotify";
import {
  shiftVolunteerRemove,
  shiftVolunteerUpdate,
} from "@/components/api/shiftVolunteers";

const shiftVolunteers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  switch (req.method) {
    // get
    // ------------------------------------------------------------
    case "GET": {
      // get all shift volunteers
      const { timeId } = req.query;
      const [dbShiftPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          d.date,
          d.datename,
          pt.position_details,
          pt.position,
          pt.prerequisite_id,
          pt.role_id,
          sn.shift_details,
          sn.shift_name,
          st.end_time,
          st.end_time_text,
          st.meal,
          st.notes,
          st.start_time,
          st.start_time_text,
          stp.position_type_id,
          stp.sap_points,
          stp.slots,
          stp.time_position_id
        FROM op_shift_times AS st
        LEFT JOIN op_dates AS d
        ON d.date_id=st.start_date_id
        JOIN op_shift_name AS sn
        ON sn.delete_shift=false
        AND sn.shift_name_id=st.shift_name_id
        JOIN op_shift_time_position AS stp
        ON stp.remove_time_position=false
        AND stp.shift_times_id=st.shift_times_id
        JOIN op_position_type AS pt
        ON pt.delete_position=false
        AND pt.position_type_id=stp.position_type_id
        WHERE st.remove_shift_time=false
        AND st.canceled=false
        AND st.shift_times_id=?
        ORDER BY pt.position COLLATE utf8mb4_general_ci`,
        [timeId]
      );
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.position,
          stp.position_type_id,
          v.playa_name,
          v.world_name,
          vs.noshow,
          vs.notes,
          vs.rating,
          vs.shiftboard_id,
          vs.time_position_id
        FROM op_volunteer_shifts AS vs
        JOIN op_shift_time_position AS stp
        ON stp.remove_time_position=false
        AND stp.time_position_id=vs.time_position_id
        AND stp.shift_times_id=?
        JOIN op_position_type AS pt
        ON pt.delete_position=false
        AND pt.position_type_id=stp.position_type_id
        JOIN op_volunteers AS v
        ON v.delete_volunteer=false
        AND v.shiftboard_id=vs.shiftboard_id
        WHERE vs.remove_shift=false
        ORDER BY
          v.playa_name COLLATE utf8mb4_general_ci,
          v.world_name COLLATE utf8mb4_general_ci`,
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
          sap_points,
          slots,
          time_position_id,
        }) => {
          const resShiftPositionItem: IResShiftPositionCountItem = {
            csp: Number(sap_points ?? 0),
            positionDetails: position_details,
            positionId: position_type_id,
            positionName: position,
            prerequisiteId: prerequisite_id ?? 0,
            roleRequiredId: role_id ?? 0,
            slotsFilled: 0,
            slotsTotal: slots,
            timePositionId: time_position_id,
          };

          return resShiftPositionItem;
        }
      );
      const resShiftVolunteerList = dbShiftVolunteerList.map(
        ({
          noshow,
          notes,
          playa_name,
          position,
          rating,
          shiftboard_id,
          time_position_id,
          world_name,
        }) => {
          const resShiftVolunteerItem: IResShiftVolunteerRowItem = {
            isCheckedIn: noshow,
            notes: notes ?? "",
            playaName: playa_name,
            positionName: position,
            rating,
            shiftboardId: shiftboard_id,
            timePositionId: time_position_id,
            worldName: world_name,
          };
          return resShiftVolunteerItem;
        }
      );

      resShiftVolunteerList.forEach((shiftVolunteerItem) => {
        const positionFound = resShiftPositionList.find(
          (resShiftPositionItem) =>
            resShiftPositionItem.timePositionId ===
            shiftVolunteerItem.timePositionId
        );
        if (positionFound) positionFound.slotsFilled += 1;
      });

      const resShiftVolunteerDetails: IResShiftVolunteerInformation = {
        positionList: resShiftPositionList,
        shift: {
          date: resShiftPositionFirst.date,
          dateName: resShiftPositionFirst.datename ?? "",
          details: resShiftPositionFirst.shift_details,
          endTime: resShiftPositionFirst.end_time ?? resShiftPositionFirst.end_time_text,
          meal: resShiftPositionFirst.meal,
          notes: resShiftPositionFirst.notes,
          startTime: resShiftPositionFirst.start_time ?? resShiftPositionFirst.start_time_text,
          typeName: resShiftPositionFirst.shift_name,
        },
        volunteerList: resShiftVolunteerList,
      };

      return res.status(200).json(resShiftVolunteerDetails);
    }

    // post
    // ------------------------------------------------------------
    case "POST": {
      // add volunteer to shift
      const { noShow, shiftboardId, timePositionId }: IReqShiftVolunteerItem =
        JSON.parse(req.body);
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM op_volunteer_shifts
        WHERE shiftboard_id=?
        AND time_position_id=?`,
        [shiftboardId, timePositionId]
      );
      const [dbShiftVolunteerFirst] = dbShiftVolunteerList;

      // if volunteer exists in shift already
      // then update add_shift and remove_shift fields
      if (dbShiftVolunteerFirst) {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_volunteer_shifts
          SET
            noshow=?,
            add_shift=true,
            remove_shift=false
          WHERE shiftboard_id=?
          AND time_position_id=?`,
          [noShow, shiftboardId, timePositionId]
        );
        // else insert them into the table
      } else {
        await pool.query<RowDataPacket[]>(
          `INSERT INTO op_volunteer_shifts (
            add_shift,
            noshow,
            shiftboard_id,
            time_position_id
          )
          VALUES (true, ?, ?, ?)`,
          [noShow, shiftboardId, timePositionId]
        );
      }

      // #309: notify the assigned volunteer with the shift details
      // and an .ics calendar attachment. Best-effort — a notify
      // failure doesn't fail the assignment itself.
      try {
        await notifyAssignment(
          pool,
          shiftboardId,
          timePositionId,
          session.shiftboardId
        );
      } catch (err) {
        console.error(
          `[assign-notify] notifyAssignment failed for shiftboard_id=${shiftboardId} time_position_id=${timePositionId}:`,
          err
        );
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
    }

    // patch
    // ------------------------------------------------------------
    case "PATCH": {
      // check volunteer into shift
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

// Hotfix 2026-05-06: this endpoint exposes volunteer playa + world names
// per shift. Wrapped in withAuth so unauth requests get 401 and forged
// cookies are rejected by HMAC verification.
export default withAuth(shiftVolunteers);
