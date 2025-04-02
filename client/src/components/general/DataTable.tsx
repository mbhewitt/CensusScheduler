import { createTheme, ThemeProvider } from "@mui/material";
import MUITable, {
  FilterType,
  MUIDataTableColumn,
  MUIDataTableOptions,
  Responsive,
} from "mui-datatables";

import { COLOR_CENSUS_PINK } from "@/constants";

interface ITableProps {
  columnList: MUIDataTableColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataTable: any[];
  optionListCustom: MUIDataTableOptions;
}

const theme = createTheme({
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          overflow: "hidden",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        root: {
          "[class*='MUIDataTableFilter-root']": {
            minWidth: "400px",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          "&.cell-header-center [class*='MUIDataTableHeadCell-contentWrapper']":
            {
              justifyContent: "center",
            },
          "&.cell-header-center > div": {
            textAlign: "center",
          },
          ".MuiButton-root": {
            fontWeight: 700,
            margin: 0,
          },
          "[class*='MUIDataTableHeadCell-sortAction']": {
            alignItems: "center",
          },
        },
      },
    },
  },
  palette: {
    primary: {
      main: COLOR_CENSUS_PINK,
    },
  },
});
export const DataTable = ({
  columnList,
  dataTable,
  optionListCustom,
}: ITableProps) => {
  // logic
  // ------------------------------------------------------------
  const optionListFinal = {
    download: false,
    elevation: 0,
    filterType: "multiselect" as FilterType,
    print: false,
    resizableColumns: true,
    responsive: "standard" as Responsive,
    rowHover: false,
    rowsPerPage: 100,
    selectableRows: undefined,
    viewColumns: false,
    ...optionListCustom,
  };

  // render
  // ------------------------------------------------------------
  return (
    <ThemeProvider theme={theme}>
      <MUITable
        title=""
        columns={columnList}
        data={dataTable}
        options={optionListFinal}
      />
    </ThemeProvider>
  );
};
