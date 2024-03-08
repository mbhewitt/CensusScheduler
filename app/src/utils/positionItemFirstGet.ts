import type { IResPositionItem } from "src/components/types";

export const positionItemFirstGet = (positionList: IResPositionItem[]) =>
  positionList.find(
    ({
      filledSlots,
      totalSlots,
    }: {
      filledSlots: number;
      totalSlots: number;
    }) => filledSlots < totalSlots
  ) || positionList[0];
