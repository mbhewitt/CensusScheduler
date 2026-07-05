import { createTheme, ThemeProvider, useMediaQuery } from "@mui/material";
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
            // 400px on desktop, but shrink to fit narrow phones so the filter
            // options don't run off the right edge (mobile bug, #478).
            minWidth: "min(400px, calc(100vw - 32px))",
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
  // On phones a wide table overflows the viewport and drags the page sideways
  // — worst case, an action-column ⋮ ends up off-screen and traps the user
  // (#478). Stack rows into labeled cards there; desktop keeps the normal
  // scrolling table. resizableColumns off — it forces fixed widths that fight
  // the responsive layout.
  const isMobile = useMediaQuery("(max-width:600px)");
  const optionListFinal = {
    download: false,
    elevation: 0,
    filterType: "multiselect" as FilterType,
    print: false,
    // keep desktop drag-resize; off on mobile (irrelevant in stacked mode)
    resizableColumns: !isMobile,
    responsive: (isMobile ? "vertical" : "standard") as Responsive,
    rowHover: false,
    rowsPerPage: 100,
    selectableRows: undefined,
    // "Reset" clears every active filter (incl. the default ones), so label it
    // for what it actually does (#143). mui-datatables deep-merges textLabels.
    textLabels: {
      filter: {
        reset: "Remove all filters",
      },
    },
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
