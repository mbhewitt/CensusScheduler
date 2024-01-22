import { IDataPositionItem } from "src/components/types";

export const positionItemFirstGet = (positionList: IDataPositionItem[]) =>
  positionList.find(({ freeSlots }: { freeSlots: number }) => freeSlots > 0) ||
  positionList[0];
