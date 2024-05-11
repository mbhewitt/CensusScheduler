import { RowDataPacket } from "mysql2";

import type { IResShiftItem } from "src/components/types";

export const getShiftList = (dbShiftList: RowDataPacket[]) => {
  const shiftPositionIdMap: { [key: string]: boolean } = {};
  const shiftListNew: IResShiftItem[] = [];

  dbShiftList.forEach((dbShiftItem: RowDataPacket) => {
    const shiftPositionIdItem = `${dbShiftItem.shift_times_id}${dbShiftItem.position_type_id}`;
    const dbShiftItemLast = shiftListNew[shiftListNew.length - 1];

    // if the database row has new shift times ID
    // then create new object
    if (
      !dbShiftItemLast ||
      dbShiftItemLast.timeId !== dbShiftItem.shift_times_id
    ) {
      shiftPositionIdMap[shiftPositionIdItem] = true;

      const dbShiftItemNew = {
        categoryId: dbShiftItem.shift_category_id,
        date: dbShiftItem.date,
        dateName: dbShiftItem.datename ?? "",
        departmentName: dbShiftItem.department ?? "",
        endTime: dbShiftItem.end_time,
        filledSlots: dbShiftItem.shiftboard_id ? 1 : 0,
        startTime: dbShiftItem.start_time,
        timeId: dbShiftItem.shift_times_id,
        totalSlots: dbShiftItem.total_slots,
        type: dbShiftItem.shift_name,
        year: dbShiftItem.year,
      };

      shiftListNew.push(dbShiftItemNew);
    }

    // if database row has same shift times ID
    // but has new position ID
    // then add to total slots
    if (!shiftPositionIdMap[shiftPositionIdItem]) {
      shiftPositionIdMap[shiftPositionIdItem] = true;
      dbShiftItemLast.totalSlots += dbShiftItem.total_slots;
    }
    // if volunteer ID exists
    // then add to filled slots
    if (dbShiftItem.shiftboard_id) dbShiftItemLast.filledSlots += 1;
  });

  return shiftListNew;
};
