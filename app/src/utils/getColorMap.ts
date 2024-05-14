import {
  blue,
  green,
  orange,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";

interface IRowList {
  department: {
    name: string;
  };
}

export const getColorMap = (rowList: IRowList[]) => {
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

  rowList.forEach(({ department: { name } }) => {
    if (!colorMap[name]) {
      colorMap[name] = colorList[colorIndexCurrent];
      colorIndexCurrent += 1;
    }
  });

  return colorMap;
};
