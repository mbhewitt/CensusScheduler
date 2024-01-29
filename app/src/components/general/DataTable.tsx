import { createTheme, ThemeProvider } from "@mui/material";
import MUIDataTable, {
  FilterType,
  MUIDataTableColumn,
  MUIDataTableOptions,
  Responsive,
} from "mui-datatables";

import { CENSUS_PINK } from "src/constants";

interface IDataTableProps {
  columnList: MUIDataTableColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataTable: any[];
  optionListCustom: MUIDataTableOptions;
}

export const DataTable = ({
  columnList,
  dataTable,
  optionListCustom,
}: IDataTableProps) => {
  const theme = createTheme({
    components: {
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
          root: {
            "&.center [class*='MUIDataTableHeadCell-contentWrapper']": {
              justifyContent: "center",
              ".MuiButton-root": {
                marginLeft: 0,
                marginRight: 0,
              },
            },
          },
          head: {
            ".MuiButton-root": {
              fontWeight: 700,
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
        main: CENSUS_PINK,
      },
    },
  });
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

  return (
    <ThemeProvider theme={theme}>
      <MUIDataTable
        title=""
        columns={columnList}
        data={dataTable}
        options={optionListFinal}
      />
    </ThemeProvider>
  );
};