import { RowDataPacket } from "mysql2";

import type { IResShiftRowItem } from "@/components/types/shifts";

export const getShiftList = (dbShiftList: RowDataPacket[]) => {
  const shiftPositionIdMap: { [key: string]: boolean } = {};
  const shiftListNew: IResShiftRowItem[] = [];

  dbShiftList.forEach(
    ({
      datename,
      department,
      end_time_lt,
      position_type_id,
      shift_category_id,
      shift_name,
      shift_times_id,
      shiftboard_id,
      start_time_lt,
      slots,
    }: RowDataPacket) => {
      const shiftPositionIdItem = `${shift_times_id}${position_type_id}`;
      const dbShiftLast: IResShiftRowItem | undefined = shiftListNew.at(-1);

      // if the database row has new shift times ID
      // then create new object
      if (!dbShiftLast || dbShiftLast.id !== shift_times_id) {
        shiftPositionIdMap[shiftPositionIdItem] = true;

        const dbShiftItemNew: IResShiftRowItem = {
          category: { id: shift_category_id },
          dateName: datename ?? "",
          department: { name: department ?? "" },
          endTime: end_time_lt,
          filledSlots: shiftboard_id ? 1 : 0,
          id: shift_times_id,
          startTime: start_time_lt,
          totalSlots: slots,
          type: shift_name,
        };

        shiftListNew.push(dbShiftItemNew);
      }

      // if database row has same shift times ID
      // but has new position ID
      // then add to total slots
      if (dbShiftLast && !shiftPositionIdMap[shiftPositionIdItem]) {
        shiftPositionIdMap[shiftPositionIdItem] = true;
        dbShiftLast.totalSlots += slots;
      }
      // if volunteer ID exists
      // then add to filled slots
      if (dbShiftLast && dbShiftLast.id === shift_times_id && shiftboard_id)
        dbShiftLast.filledSlots += 1;
    }
  );

  return shiftListNew;
};
