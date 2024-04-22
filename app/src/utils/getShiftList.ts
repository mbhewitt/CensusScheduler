import { RowDataPacket } from "mysql2";

import type { IResShiftItem } from "src/components/types";

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

export const getShiftList = (dbShiftList: RowDataPacket[]) => {
  const shiftPositionIdMap: { [key: string]: boolean } = {};

  return dbShiftList.reduce(
    (rowList: IResShiftItem[], rowItem: IDbShiftItem | RowDataPacket) => {
      const shiftPositionIdItem = `${rowItem.shift_times_id}${rowItem.position_type_id}`;
      const rowListLast = rowList[rowList.length - 1];

      // if the database row has new shift times ID
      // then create new object
      if (!rowListLast || rowListLast.timeId !== rowItem.shift_times_id) {
        shiftPositionIdMap[shiftPositionIdItem] = true;

        const rowItemNew = {
          category: rowItem.category ?? "",
          categoryId: rowItem.shift_category_id,
          date: rowItem.date,
          dateName: rowItem.datename ?? "",
          endTime: rowItem.end_time,
          filledSlots: rowItem.shiftboard_id ? 1 : 0,
          startTime: rowItem.start_time,
          timeId: rowItem.shift_times_id,
          totalSlots: rowItem.total_slots,
          type: rowItem.shift_name,
          year: rowItem.year,
        };

        return [...rowList, rowItemNew];
      }
      // if the database row has the same shift times ID
      // but has new position ID
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
};
