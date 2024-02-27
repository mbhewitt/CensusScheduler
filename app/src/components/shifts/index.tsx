import { Chip, Container, lighten } from "@mui/material";
import {
  blue,
  green,
  orange,
  purple,
  red,
  teal,
  yellow,
} from "@mui/material/colors";
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
import type { IShiftItem } from "src/components/types";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { fetcherGet } from "src/utils/fetcher";

export const Shifts = () => {
  const {
    developerModeState: {
      dateTime: { value: dateTimeValue },
    },
  } = useContext(DeveloperModeContext);
  const { data, error } = useSWR("/api/shifts", fetcherGet);
  const router = useRouter();
  const theme = useTheme();

  // set up variables to manipulate columns
  const columnNameDateHidden = "Date - hidden";
  const columnNameDate = "Date";
  const columnNameNameHidden = "Name - hidden";

  dayjs.extend(isSameOrAfter);

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
      name: columnNameNameHidden, // hide for filter dialog
      label: "Name",
      options: {
        display: false,
      },
    },
    {
      name: "Name",
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
      name: "Filled / Max",
      options: {
        filterOptions: {
          logic: (value: string, filterValue: string[]) => {
            const [filled, max] = value
              .split(" / ")
              .map((string) => Number(string));
            const show =
              (filterValue.indexOf("Full") >= 0 && filled >= max) ||
              (filterValue.indexOf("Open") >= 0 && filled < max);

            // returning false means that the value will display
            return !show;
          },
          names: ["Full", "Open"],
        },
        sort: false,
      },
    },
  ]);

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
    // then customize the filter options display for date and name columns
    if (data) {
      const dateFilterList: string[] = [];
      const shiftNameFilterList: string[] = [];

      data.forEach(({ date, dateName, shiftName }: IShiftItem) => {
        dateFilterList.push(dateName ? `${date} - ${dateName}` : date);
        shiftNameFilterList.push(shiftName);
      });

      const dateFilterListDisplay = [...new Set(dateFilterList)];
      const shiftNameFilterListDisplay = [
        ...new Set(shiftNameFilterList),
      ].sort();

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
              case columnNameNameHidden:
                prevColumnItem.options.filterOptions = {
                  ...prevColumnItem.options.filterOptions,
                  names: shiftNameFilterListDisplay,
                };
                break;
              default:
            }
          }
        })
      );
    }
  }, [data, setColumnList]);

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // prepare datatable
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
  const colorMap = data.reduce(
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

  const dataTable = data.map(
    ({
      category,
      date,
      dateName,
      endTime,
      filledSlots,
      shiftName,
      shiftTimesId,
      startTime,
      totalSlots,
      year,
    }: IShiftItem) => {
      return [
        shiftTimesId,
        `${date} ${year}`,
        dateName
          ? `${dayjs(date).format("MMM DD")} - ${dateName}`
          : dayjs(date).format("MMM DD"),
        `${dayjs(startTime).format("HH:mm")} - ${dayjs(endTime).format(
          "HH:mm"
        )}`,
        shiftName,
        <Chip
          key={`${shiftTimesId}-chip`}
          label={shiftName}
          sx={{ backgroundColor: colorMap[category] }}
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
      router.push(`/shifts/shift-account/${row[0]}`);
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
        <DataTable
          columnList={columnList}
          dataTable={dataTable}
          optionListCustom={optionListCustom}
        />
      </Container>
    </>
  );
};
