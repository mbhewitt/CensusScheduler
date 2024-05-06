import { Box, Chip, Container, lighten } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { MUIDataTableColumn } from "mui-datatables";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import useSWR from "swr";
import { useImmer } from "use-immer";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { Hero } from "src/components/layout/Hero";
import type { IResShiftItem } from "src/components/types";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { fetcherGet } from "src/utils/fetcher";
import { formatDateName, formatTime } from "src/utils/formatDateTime";
import { getColorMap } from "src/utils/getColorMap";

export const Shifts = () => {
  // context
  // --------------------
  const {
    developerModeState: {
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);

  // state
  // --------------------
  const columnNameDateHidden = "Date - hidden";
  const columnNameDate = "Date";
  const columnNameTypeHidden = "Type - hidden";
  const [columnList, setColumnList] = useImmer<MUIDataTableColumn[]>([
    {
      name: "Shift Times ID - hidden", // hide for row click
      options: {
        display: false,
        filter: false,
      },
    },
    {
      name: columnNameDateHidden, // hide for filter dialog
      label: "Timeline",
      options: {
        display: false,
        filterOptions: {
          names: ["Present / Future", "Past"],
        },
      },
    },
    {
      name: columnNameDate,
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Time",
      options: { filter: false, sortThirdClickReset: true },
    },
    {
      name: columnNameTypeHidden, // hide for filter dialog
      label: "Type",
      options: {
        display: false,
      },
    },
    {
      name: "Type",
      options: {
        filter: false,
        sortThirdClickReset: true,
        sortCompare: (order: string) => {
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shift1: { [key: string]: any },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shift2: { [key: string]: any }
          ) => {
            const value1 = shift1.data.props.label;
            const value2 = shift2.data.props.label;

            return value1 > value2 && order === "asc" ? 1 : -1;
          };
        },
      },
    },
    {
      name: "Filled / Total",
      options: {
        filterOptions: {
          logic: (value: string, filterValue: string[]) => {
            const [filled, total] = value
              .split(" / ")
              .map((string) => Number(string));
            const show =
              (filterValue.indexOf("Full") >= 0 && filled >= total) ||
              (filterValue.indexOf("Open") >= 0 && filled < total);

            // returning false means that the value will display
            return !show;
          },
          names: ["Full", "Open"],
        },
        sort: false,
      },
    },
  ]);

  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/shifts", fetcherGet);

  // other hooks
  // --------------------
  const router = useRouter();
  const theme = useTheme();

  // side effects
  // --------------------
  useEffect(() => {
    // if filter list state is stored in session storage
    // then update column list state with filter list state
    const filterListStateStorage = JSON.parse(
      sessionStorage.getItem("filterListState") ?? "[]"
    );

    if (filterListStateStorage.length > 0) {
      setColumnList((prevColumnList) =>
        prevColumnList.forEach((prevColumnItem, index) => {
          if (prevColumnItem.options) {
            prevColumnItem.options.filterList = filterListStateStorage[index];
          }
        })
      );
    }
  }, [setColumnList]);
  useEffect(() => {
    // if dateTimeValue updates
    // then update filter logic for "Date - hidden" column
    setColumnList((prevColumnList) => {
      prevColumnList.forEach((prevColumnItem) => {
        if (
          prevColumnItem.name === columnNameDateHidden &&
          prevColumnItem.options &&
          prevColumnItem.options.filterOptions
        ) {
          prevColumnItem.options.filterOptions.logic = (
            dateHiddenValue: string,
            filterValue: string[]
          ) => {
            const show =
              (filterValue.indexOf("Present / Future") >= 0 &&
                dayjs(dateHiddenValue).isSameOrAfter(dateTimeValue, "date")) ||
              (filterValue.indexOf("Past") >= 0 &&
                dayjs(dateHiddenValue).isBefore(dateTimeValue, "date"));

            // returning false means that the value will display
            return !show;
          };
        }
      });
    });
  }, [dateTimeValue, setColumnList]);
  useEffect(() => {
    // if data exists
    // then customize the filter options display for date and type columns
    if (data) {
      const dateFilterList: string[] = [];
      const typeFilterList: string[] = [];

      data.forEach(({ date, dateName, type }: IResShiftItem) => {
        dateFilterList.push(
          dateName ? formatDateName(date, dateName) : formatDateName(date, null)
        );
        typeFilterList.push(type);
      });

      const dateFilterListDisplay = [...new Set(dateFilterList)];
      const typeFilterListDisplay = [...new Set(typeFilterList)].sort();

      setColumnList((prevColumnList) =>
        prevColumnList.forEach((prevColumnItem) => {
          if (prevColumnItem.options) {
            switch (prevColumnItem.name) {
              case columnNameDate:
                prevColumnItem.options.filterOptions = {
                  ...prevColumnItem.options.filterOptions,
                  names: dateFilterListDisplay,
                };
                break;
              case columnNameTypeHidden:
                prevColumnItem.options.filterOptions = {
                  ...prevColumnItem.options.filterOptions,
                  names: typeFilterListDisplay,
                };
                break;
              default:
            }
          }
        })
      );
    }
  }, [data, setColumnList]);

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  dayjs.extend(isSameOrAfter);

  // prepare datatable
  const colorMapDisplay = getColorMap(data);
  const dataTable = data.map(
    ({
      category,
      date,
      dateName,
      endTime,
      filledSlots,
      startTime,
      timeId,
      totalSlots,
      type,
      year,
    }: IResShiftItem) => {
      return [
        timeId,
        `${date} ${year}`,
        formatDateName(date, dateName),
        formatTime(startTime, endTime),
        type,
        <Chip
          key={`${timeId}-chip`}
          label={type}
          sx={{ backgroundColor: colorMapDisplay[category] }}
        />,
        `${filledSlots} / ${totalSlots}`,
      ];
    }
  );
  let shiftDateCurrent = "";
  let shiftDateToggle = false;
  const optionListCustom = {
    onFilterChange: (
      _: MUIDataTableColumn | null | string,
      filterList: string[][]
    ) => {
      sessionStorage.setItem("filterListState", JSON.stringify(filterList));
    },
    onRowClick: (row: string[]) => {
      router.push(`/shifts/volunteers/${row[0]}`);
    },
    rowHover: true,
    rowsPerPage: 200,
    rowsPerPageOptions: [10, 15, 100, 200],
    search: false,
    setRowProps: (row: string[]) => {
      if (row[1] !== shiftDateCurrent) {
        [, shiftDateCurrent] = row;
        shiftDateToggle = !shiftDateToggle;
      }

      return {
        sx: {
          backgroundColor: shiftDateToggle
            ? lighten(theme.palette.secondary.main, 0.9)
            : theme.palette.common.white,
          cursor: "pointer",
        },
      };
    },
    sortFilterList: false,
  };

  // render
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="census volunteers riding the census art car"
            fill
            priority
            src="/shifts/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Shifts"
      />
      <Container component="main">
        <Box component="section">
          <DataTable
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
          />
        </Box>
      </Container>
    </>
  );
};
