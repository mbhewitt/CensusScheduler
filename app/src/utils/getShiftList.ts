import { RowDataPacket } from "mysql2";

import type { IResShiftItem } from "src/components/types";

export const getShiftList = (dbShiftList: RowDataPacket[]) => {
  const shiftPositionIdMap: { [key: string]: boolean } = {};
  const shiftListNew: IResShiftItem[] = [];

  dbShiftList.forEach(
    ({
      shift_category_id,
      date,
      datename,
      department,
      end_time,
      position_type_id,
      shiftboard_id,
      start_time,
      shift_times_id,
      total_slots,
      shift_name,
      year,
    }: RowDataPacket) => {
      const shiftPositionIdItem = `${shift_times_id}${position_type_id}`;
      const dbShiftLast = shiftListNew[shiftListNew.length - 1];

      // if the database row has new shift times ID
      // then create new object
      if (!dbShiftLast || dbShiftLast.timeId !== shift_times_id) {
        shiftPositionIdMap[shiftPositionIdItem] = true;

        const dbShiftItemNew = {
          categoryId: shift_category_id,
          date,
          dateName: datename ?? "",
          departmentName: department ?? "",
          endTime: end_time,
          filledSlots: shiftboard_id ? 1 : 0,
          startTime: start_time,
          timeId: shift_times_id,
          totalSlots: total_slots,
          type: shift_name,
          year,
        };

        shiftListNew.push(dbShiftItemNew);
      }

      // if database row has same shift times ID
      // but has new position ID
      // then add to total slots
      if (!shiftPositionIdMap[shiftPositionIdItem]) {
        shiftPositionIdMap[shiftPositionIdItem] = true;
        dbShiftLast.totalSlots += total_slots;
      }
      // if volunteer ID exists
      // then add to filled slots
      if (shiftboard_id) dbShiftLast.filledSlots += 1;
    }
  );

  return shiftListNew;
};
