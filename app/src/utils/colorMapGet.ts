import {
  blue,
  green,
  orange,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";

import type { IResShiftItem } from "src/components/types";

export const colorMapGet = (data: IResShiftItem[]) => {
  const colorList = [
    red[100],
    orange[100],
    yellow[100],
    green[100],
    teal[100],
    blue[100],
    purple[100],
  ];
  let colorIndexCurrent = 0;

  return data.reduce(
    (
      shiftListTotal: { [key: string]: string },
      { category }: { category: string }
    ) => {
      const shiftListTotalNew = structuredClone(shiftListTotal);

      if (!shiftListTotalNew[category]) {
        shiftListTotalNew[category] = colorList[colorIndexCurrent];
        colorIndexCurrent += 1;
      }

      return shiftListTotalNew;
    },
    {}
  );
};
