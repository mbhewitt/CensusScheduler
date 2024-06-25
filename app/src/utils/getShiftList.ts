import { RowDataPacket } from "mysql2";

import type { IResShiftRowItem } from "src/components/types/shifts";

export const getShiftList = (dbShiftList: RowDataPacket[]) => {
  const shiftPositionIdMap: { [key: string]: boolean } = {};
  const shiftListNew: IResShiftRowItem[] = [];

  dbShiftList.forEach(
    ({
      date,
      datename,
      department,
      end_time,
      position_type_id,
      shift_category_id,
      shift_name,
      shift_times_id,
      shiftboard_id,
      start_time,
      total_slots,
    }: RowDataPacket) => {
      const shiftPositionIdItem = `${shift_times_id}${position_type_id}`;
      const dbShiftLast: IResShiftRowItem =
        shiftListNew[shiftListNew.length - 1];

      // if the database row has new shift times ID
      // then create new object
      if (!dbShiftLast || dbShiftLast.id !== shift_times_id) {
        shiftPositionIdMap[shiftPositionIdItem] = true;

        const dbShiftItemNew: IResShiftRowItem = {
          category: { id: shift_category_id },
          date,
          dateName: datename ?? "",
          department: { name: department ?? "" },
          endTime: end_time,
          filledSlots: shiftboard_id ? 1 : 0,
          id: shift_times_id,
          startTime: start_time,
          totalSlots: total_slots,
          type: shift_name,
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
      if (dbShiftLast && dbShiftLast.id === shift_times_id && shiftboard_id)
        dbShiftLast.filledSlots += 1;
    }
  );

  return shiftListNew;
};
