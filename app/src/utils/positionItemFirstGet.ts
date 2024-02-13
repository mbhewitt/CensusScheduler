import { IPositionItem } from "src/components/types";

export const positionItemFirstGet = (positionList: IPositionItem[]) =>
  positionList.find(({ freeSlots }: { freeSlots: number }) => freeSlots > 0) ||
  positionList[0];
