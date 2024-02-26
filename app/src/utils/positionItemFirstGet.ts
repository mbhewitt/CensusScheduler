import { IPositionItem } from "src/components/types";

export const positionItemFirstGet = (positionList: IPositionItem[]) =>
  positionList.find(
    ({
      filledSlots,
      totalSlots,
    }: {
      filledSlots: number;
      totalSlots: number;
    }) => filledSlots < totalSlots
  ) || positionList[0];
