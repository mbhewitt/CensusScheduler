import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import type { IShiftItem, IShiftPositionListItem } from "src/components/types";

interface IDbShiftItem {
  category: null | string;
  date: Date;
  datename: null | string;
  end_time: Date;
  position_type_id: number;
  shift_category_id: number;
  shift_name: string;
  shift_times_id: number;
  shiftboard_id: number;
  start_time: Date;
  total_slots: number;
  year: string;
}
interface IDbShiftPositionListItem {
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
      let dbShiftList = [];
      // if adding a shift to a volunteer
      // then get all shifts and positions
      if (filter === "positions") {
        // const [dbShiftList] = await pool.query<RowDataPacket[]>(
        //   `SELECT date, datename, details, end_time, free_slots, position, role, shift_id, shift_position_id, shift, shortname, start_time, total_slots
        //   FROM op_shifts
        //   WHERE delete_shift=false AND off_playa=false
        //   ORDER BY start_time`
        // );
        // const resShiftList = dbShiftList.reduce(
        //   (
        //     rowList: IShiftPositionListItem[],
        //     rowItem: IDbShiftPositionListItem | RowDataPacket
        //   ) => {
        //     const rowListLast = rowList[rowList.length - 1];
        //     const positionNew = {
        //       details: rowItem.details,
        //       freeSlots: Number(rowItem.free_slots),
        //       position: rowItem.position,
        //       role: rowItem.role,
        //       shiftPositionId: rowItem.shift_position_id,
        //       totalSlots: Number(rowItem.total_slots),
        //     };
        //     // if the array is empty or if the new shift id is dfferent than the last one
        //     // then add the new shift to the array
        //     if (!rowListLast || rowListLast.shiftId !== rowItem.shift_id) {
        //       const rowItemNew = {
        //         date: new Date(rowItem.date).toLocaleDateString("en-US", {
        //           month: "short",
        //           day: "2-digit",
        //         }),
        //         dateName: rowItem.datename,
        //         endTime: rowItem.end_time,
        //         freeSlots: Number(rowItem.free_slots),
        //         positionList: [positionNew],
        //         shift: rowItem.shift,
        //         shiftId: rowItem.shift_id,
        //         shortName: rowItem.shortname,
        //         startTime: rowItem.start_time,
        //         totalSlots: Number(rowItem.total_slots),
        //       };
        //       return [...rowList, rowItemNew];
        //     }
        //     // else add the position to the last shift
        //     rowListLast.positionList.push(positionNew);
        //     rowListLast.freeSlots += Number(rowItem.free_slots);
        //     rowListLast.totalSlots += Number(rowItem.total_slots);
        //     return rowList;
        //   },
        //   []
        // );
        // return res.status(200).json(resShiftList);
      }

      // get all training shifts
      if (filter === "trainings") {
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT sc.category, sc.shift_category_id, st.date, d.datename, st.end_time, sp.position_type_id, sn.shift_name, st.shift_times_id, vs.shiftboard_id, st.start_time, sp.total_slots, st.year, vs.remove_shift
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON st.shift_name_id=sn.shift_name_id
          LEFT JOIN op_shift_category AS sc
          ON sc.shift_category_id=sn.shift_category_id
          LEFT JOIN op_dates AS d
          ON d.date=st.date
          JOIN op_shift_position AS sp
          ON sp.shift_name_id=sn.shift_name_id
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.shift_position_id=sp.shift_position_id AND vs.shift_times_id=st.shift_times_id
          WHERE sc.category="Training" AND sn.delete_shift=false AND sn.off_playa=false AND vs.remove_shift=false AND st.remove_shift_time=false
          ORDER BY st.start_time`
        );
      } else {
        // get all shifts
        [dbShiftList] = await pool.query<RowDataPacket[]>(
          `SELECT sc.category, sc.shift_category_id, st.date, d.datename, st.end_time, sp.position_type_id, sn.shift_name, st.shift_times_id, vs.shiftboard_id, st.start_time, sp.total_slots, st.year, vs.remove_shift
          FROM op_shift_times AS st
          JOIN op_shift_name AS sn
          ON st.shift_name_id=sn.shift_name_id
          LEFT JOIN op_shift_category AS sc
          ON sc.shift_category_id=sn.shift_category_id
          LEFT JOIN op_dates AS d
          ON d.date=st.date
          JOIN op_shift_position AS sp
          ON sp.shift_name_id=sn.shift_name_id
          LEFT JOIN op_volunteer_shifts AS vs
          ON vs.shift_position_id=sp.shift_position_id AND vs.shift_times_id=st.shift_times_id
          WHERE sn.delete_shift=false AND sn.off_playa=false AND vs.remove_shift=false AND st.remove_shift_time=false
          ORDER BY st.start_time`
        );
      }
      const shiftPositionIdMap: { [key: string]: boolean } = {};
      const resShiftList = dbShiftList.reduce(
        (rowList: IShiftItem[], rowItem: IDbShiftItem | RowDataPacket) => {
          const shiftPositionIdItem = `${rowItem.shift_times_id}${rowItem.position_type_id}`;
          const rowListLast = rowList[rowList.length - 1];

          // if the database row has a new shift times ID
          // then create a new object
          if (
            !rowListLast ||
            rowListLast.shiftTimesId !== rowItem.shift_times_id
          ) {
            shiftPositionIdMap[shiftPositionIdItem] = true;

            const rowItemNew = {
              category: rowItem.category ?? "",
              date: rowItem.date,
              dateName: rowItem.datename ?? "",
              endTime: rowItem.end_time,
              filledSlots: rowItem.shiftboard_id ? 1 : 0,
              shiftCategoryId: rowItem.shift_category_id,
              shiftName: rowItem.shift_name,
              shiftTimesId: rowItem.shift_times_id,
              startTime: rowItem.start_time,
              totalSlots: rowItem.total_slots,
              year: rowItem.year,
            };

            return [...rowList, rowItemNew];
          }
          // if the database row has the same shift times ID
          // but has a new position ID
          // then add to the total slots
          if (!shiftPositionIdMap[shiftPositionIdItem]) {
            shiftPositionIdMap[shiftPositionIdItem] = true;
            rowListLast.totalSlots += rowItem.total_slots;
          }
          // if the volunteer ID exists
          // then add to the filled slots
          if (rowItem.shiftboard_id) rowListLast.filledSlots += 1;

          return rowList;
        },
        []
      );

      return res.status(200).json(resShiftList);
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
