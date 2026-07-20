import {
  blue,
  green,
  orange,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";

// Per-type chip color overrides. Type chips are normally colored by department
// (getColorMap), but the PEERS taxonomy puts every shift in one department, so
// all types share the same color. Override specific shift types here to visually
// distinguish them (per papabear 2026-07-02). Shared by the Shifts page and the
// account "My Shifts" section so both color shifts identically.
export const TYPE_COLOR_OVERRIDES: { [type: string]: string } = {
  "PEERS Coordinator On Call (PCoC) Shift": green[100],
  "PEERS Coordinator in Office (PCiO) shift": green[100],
  "PEERS Lead Shift (HQ)": blue[100],
};

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
