import {
  blue,
  green,
  orange,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";

import { IResShiftItem } from "src/components/types";

export const getColorMap = (rowList: IResShiftItem[]) => {
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
  const colorMap: { [key: string]: string } = {};

  rowList.forEach(({ departmentName }) => {
    if (!colorMap[departmentName]) {
      colorMap[departmentName] = colorList[colorIndexCurrent];
      colorIndexCurrent += 1;
    }
  });

  return colorMap;
};
