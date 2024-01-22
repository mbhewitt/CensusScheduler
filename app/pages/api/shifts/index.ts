import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type {
  IDataShiftItem,
  IDataShiftPositionListItem,
} from "src/components/types";

interface IDataDbShiftItem {
  date: string;
  datename: string;
  category: string;
  free_slots: number;
  shift_id: string;
  shift: string;
  shortname: string;
  total_slots: number;
  year: number;
}
interface IDataDbShiftPositionListItem {
  date: string;
  datename: string;
  details: string;
  end_time: string;
  free_slots: string;
  position: string;
  role: string;
  shift_id: string;
  shift_position_id: string;
  shift: string;
  shortname: string;
  start_time: string;
  total_slots: string;
}

const shifts = async (req: NextApiRequest, res: NextApiResponse) => {
  const { filter } = req.query;

  switch (req.method) {
    // get
    case "GET": {
      // if adding a shift to a volunteer
      // then get all shifts and positions
      if (filter === "positions") {
        const [dataDb] = await pool.query<RowDataPacket[]>(
          `SELECT date, datename, details, end_time, free_slots, position, role, shift_id, shift_position_id, shift, shortname, start_time, total_slots
          FROM op_shifts
          WHERE delete_shift=false AND off_playa=false
          ORDER BY start_time`
        );
        const shiftList = dataDb.reduce(
          (
            rowList: IDataShiftPositionListItem[],
            rowItem: IDataDbShiftPositionListItem | RowDataPacket
          ) => {
            const rowListLast = rowList[rowList.length - 1];
            const positionNew = {
              details: rowItem.details,
              freeSlots: Number(rowItem.free_slots),
              position: rowItem.position,
              role: rowItem.role,
              shiftPositionId: rowItem.shift_position_id,
              totalSlots: Number(rowItem.total_slots),
            };

            // if the array is empty or if the new shift id is dfferent than the last one
            // then add the new shift to the array
            if (!rowListLast || rowListLast.shiftId !== rowItem.shift_id) {
              const rowItemNew = {
                date: new Date(rowItem.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                }),
                dateName: rowItem.datename,
                endTime: rowItem.end_time,
                freeSlots: Number(rowItem.free_slots),
                positionList: [positionNew],
                shift: rowItem.shift,
                shiftId: rowItem.shift_id,
                shortName: rowItem.shortname,
                startTime: rowItem.start_time,
                totalSlots: Number(rowItem.total_slots),
              };

              return [...rowList, rowItemNew];
            }
            // else add the position to the last shift
            rowListLast.positionList.push(positionNew);

            rowListLast.freeSlots += Number(rowItem.free_slots);
            rowListLast.totalSlots += Number(rowItem.total_slots);

            return rowList;
          },
          []
        );

        return res.status(200).json({
          shiftList,
        });
      }

      // get all shifts
      const [dataDb] = await pool.query<RowDataPacket[]>(
        `SELECT category, date, datename, free_slots, shift_id, shift, shortname, total_slots, year
        FROM op_shifts
        WHERE delete_shift=false AND off_playa=false
        ORDER BY start_time`
      );
      const shiftList = dataDb.reduce(
        (
          rowList: IDataShiftItem[],
          rowItem: IDataDbShiftItem | RowDataPacket
        ) => {
          const rowListLast = rowList[rowList.length - 1];

          if (!rowListLast || rowListLast.shiftId !== rowItem.shift_id) {
            const rowItemNew = {
              category: rowItem.category,
              date: new Date(rowItem.date).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              }),
              dateName: rowItem.datename,
              freeSlots: Number(rowItem.free_slots),
              shift: rowItem.shift,
              shiftId: rowItem.shift_id,
              shortName: rowItem.shortname,
              totalSlots: Number(rowItem.total_slots),
              year: Number(rowItem.year),
            };

            return [...rowList, rowItemNew];
          }
          rowListLast.freeSlots += Number(rowItem.free_slots);
          rowListLast.totalSlots += Number(rowItem.total_slots);

          return rowList;
        },
        []
      );

      return res.status(200).json({
        shiftList,
      });
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

export default shifts;
