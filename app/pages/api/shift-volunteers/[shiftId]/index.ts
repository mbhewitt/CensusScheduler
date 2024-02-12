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
      const { shiftId } = req.query;
      const [dbShiftVolunteerList] = await pool.query<RowDataPacket[]>(
        `SELECT date, datename, details, end_time, free_slots, noshow, playa_name, position, role, s.shift_position_id, shift, shiftboard_id, shortname, start_time, total_slots, world_name
        FROM op_shifts AS s
        JOIN op_volunteer_shifts AS vs
        ON (s.shift_position_id=vs.shift_position_id AND s.delete_shift=false AND vs.delete_shift=false)
        JOIN op_volunteers
        USING (shiftboard_id)
        WHERE shift_id=?
        ORDER BY playa_name, world_name`,
        [shiftId]
      );
      const shiftVolunteerItem = dbShiftVolunteerList[0];
      const positionMap: { [key: string]: string } = {};
      const positionList = dbShiftVolunteerList
        .reduce(
          (
            positionTotal: IPositionItem[],
            {
              details,
              free_slots,
              position,
              role,
              shift_position_id,
              total_slots,
            }: RowDataPacket
          ) => {
            if (!positionMap[shift_position_id]) {
              positionMap[shift_position_id] = position;

              return [
                ...positionTotal,
                {
                  details,
                  freeSlots: Number(free_slots),
                  position,
                  role,
                  shiftPositionId: shift_position_id,
                  totalSlots: Number(total_slots),
                },
              ];
            }

            return positionTotal;
          },
          []
        )
        .sort(
          (a, b) =>
            Number(a.position > b.position) - Number(a.position < b.position)
        );

      const shiftVolunteerList = dbShiftVolunteerList.reduce(
        (
          volunteerTotal,
          {
            noshow,
            playa_name,
            position,
            shift_position_id,
            shiftboard_id,
            world_name,
          }
        ) => {
          if (shiftboard_id === 0) return volunteerTotal;

          volunteerTotal.push({
            noShow: noshow,
            playaName: playa_name,
            position,
            shiftboardId: shiftboard_id,
            shiftPositionId: shift_position_id,
            worldName: world_name,
          });

          return volunteerTotal;
        },
        [] as IShiftVolunteerItem[]
      );

      return res.status(200).json({
        date: new Date(shiftVolunteerItem.date).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        }),
        dateName: shiftVolunteerItem.datename,
        endTime: shiftVolunteerItem.end_time,
        positionList,
        shift: shiftVolunteerItem.shift,
        shiftVolunteerList,
        shortName: shiftVolunteerItem.shortname,
        startTime: shiftVolunteerItem.start_time,
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
