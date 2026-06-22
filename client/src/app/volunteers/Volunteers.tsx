"use client";

import { Chat as ChatIcon } from "@mui/icons-material";
import { Box, Chip, Container, Typography } from "@mui/material";
import { green, grey, red } from "@mui/material/colors";
import { FilterType } from "mui-datatables";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { DataTable } from "@/components/general/DataTable";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { Hero } from "@/components/layout/Hero";
import type { IResVolunteerShiftCountItem } from "@/components/types/volunteers";
import { fetcherGet } from "@/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "@/utils/setCellPropsCenter";

const sortCompareShiftCount = (order: string) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volunteer1: { [key: string]: any },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volunteer2: { [key: string]: any }
  ) => {
    const value1 =
      volunteer1.data.props.label || Number(volunteer1.data.props.children);
    const value2 =
      volunteer2.data.props.label || Number(volunteer2.data.props.children);

    return (value1 - value2) * (order === "asc" ? 1 : -1);
  };
};

export const Volunteers = () => {
  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IResVolunteerShiftCountItem[];
    error: Error | undefined;
  } = useSWR("/api/volunteers", fetcherGet);

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // prepare datatable
  const columnList = [
    {
      name: "Shiftboard ID - hidden",
      options: { display: false, filter: false }, // hide for row click
    },
    {
      name: "Playa name",
      options: {
        filter: false,
        sortThirdClickReset: true,
      },
    },
    {
      name: "World name",
      options: {
        filter: false,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Attended",
      options: {
        filter: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: sortCompareShiftCount,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Absent",
      options: {
        customFilterListOptions: {
          render: (value: string) => `Absent: ${value}`,
        },
        filterOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logic: (value: any, filterValue: string[]) => {
            const count = value.props.label || Number(value.props.children);
            const show = filterValue.indexOf("One or more") >= 0 && count > 0;

            // returning false means that the value will display
            return !show;
          },
          names: ["One or more"],
        },
        filterType: "checkbox" as FilterType,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: sortCompareShiftCount,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Remaining",
      options: {
        customFilterListOptions: {
          render: (value: string) => `Remaining: ${value}`,
        },
        filterOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logic: (value: any, filterValue: string[]) => {
            const count = value.props.label || Number(value.props.children);
            const show = filterValue.indexOf("One or more") >= 0 && count > 0;

            // returning false means that the value will display
            return !show;
          },
          names: ["One or more"],
        },
        filterType: "checkbox" as FilterType,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: sortCompareShiftCount,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Notes",
      options: {
        customFilterListOptions: {
          render: (value: string) => `Notes: ${value}`,
        },
        filterOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logic: (value: any, filterValue: string[]) => {
            const { color } = value.props;
            const show =
              filterValue.indexOf("Recorded") >= 0 && color === "primary";

            // returning false means that the value will display
            return !show;
          },
          names: ["Recorded"],
        },
        filterType: "checkbox" as FilterType,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: (order: string) => {
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            volunteer1: { [key: string]: any },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            volunteer2: { [key: string]: any }
          ) => {
            const value1 = volunteer1.data.props.color;
            const value2 = volunteer2.data.props.color;

            return value1 > value2 && order === "asc" ? 1 : -1;
          };
        },
        sortThirdClickReset: true,
      },
    },
  ];
  const dataTable = data.map(
    ({
      attendedCount,
      isNotes,
      noShowCount,
      playaName,
      remainingCount,
      shiftboardId,
      worldName,
    }) => {
      return [
        shiftboardId,
        playaName,
        worldName,
        attendedCount > 0 ? (
          <Typography sx={{ fontSize: "14px" }}>{attendedCount}</Typography>
        ) : (
          <Typography sx={{ color: grey[500], fontSize: "14px" }}>0</Typography>
        ),
        noShowCount > 0 ? (
          <Chip label={noShowCount} sx={{ background: red[100] }} />
        ) : (
          <Typography sx={{ color: grey[500], fontSize: "14px" }}>0</Typography>
        ),
        remainingCount > 0 ? (
          <Chip label={remainingCount} sx={{ background: green[100] }} />
        ) : (
          <Typography sx={{ color: grey[500], fontSize: "14px" }}>0</Typography>
        ),
        isNotes ? <ChatIcon color="primary" /> : <ChatIcon color="disabled" />,
      ];
    }
  );
  const optionListCustom = {
    onRowClick: (row: string[]) => {
      router.push(`/volunteers/${row[0]}/info`);
    },
    rowHover: true,
    setRowProps: () => {
      return {
        sx: {
          cursor: "pointer",
        },
      };
    },
    sortOrder: {
      direction: "asc" as const,
      name: "Playa name",
    },
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/volunteers-greeting.jpg)",
          backgroundSize: "cover",
        }}
        text="Volunteers"
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
