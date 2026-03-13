"use client";

import {
  EditCalendar as EditCalendarIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import {
  Box,
  Container,
  Button,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import useSWR from "swr";
import { Hero } from "@/components/layout/Hero";

import { DatesDialogCreate } from "@/app/dates/DatesDialogCreate";
import { DatesDialogDelete } from "@/app/dates/DatesDialogDelete";
import { DatesDialogUpdate } from "@/app/dates/DatesDialogUpdate";
import { DataTable } from "@/components/general/DataTable";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { MoreMenu } from "@/components/general/MoreMenu";
import { IResDateRowItem } from "@/components/types/dates";
import { fetcherGet } from "@/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "@/utils/setCellPropsCenter";
import { formatDateDay, formatDateYear } from "@/utils/formatDateTime";

enum DialogList {
  Create,
  Delete,
  Update,
}

export const Dates = () => {
  // state
  // ------------------------------------------------------------
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    dateItem: {
      date: "",
      id: 0,
      name: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const { data, error }: { data: IResDateRowItem[]; error: Error | undefined } =
    useSWR("/api/dates", fetcherGet);

  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // prepare datatable
  const columnList = [
    {
      name: "Date",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Day",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Name",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Actions",
      options: {
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
  ];
  const dataTable = data.map(({ date, id, name }) => {
    return [
      formatDateYear(date),
      formatDateDay(date),
      name,
      <MoreMenu
        Icon={<MoreHorizIcon />}
        key={`${id}-menu`}
        MenuList={
          <MenuList>
            <MenuItem
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Update,
                  dateItem: { date, id, name },
                });
                setIsDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <EditCalendarIcon />
              </ListItemIcon>
              <ListItemText>Update date</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Delete,
                  dateItem: { date, id, name },
                });
                setIsDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <EventBusyIcon />
              </ListItemIcon>
              <ListItemText>Delete date</ListItemText>
            </MenuItem>
          </MenuList>
        }
      />,
    ];
  });
  const optionListCustom = {
    filter: false,
    sortOrder: {
      direction: "asc" as const,
      name: "Date",
    },
  };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Dates"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Create,
                  dateItem: {
                    date: "",
                    id: 0,
                    name: "",
                  },
                });
                setIsDialogOpen(true);
              }}
              startIcon={<EventAvailableIcon />}
              type="button"
              variant="contained"
            >
              Create date
            </Button>
          </Stack>
          <DataTable
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
          />

          {/* create dialog */}
          <DatesDialogCreate
            handleDialogClose={() => setIsDialogOpen(false)}
            isDialogOpen={
              dialogCurrent.dialogItem === DialogList.Create && isDialogOpen
            }
            dateList={data}
          />

          {/* delete dialog */}
          <DatesDialogDelete
            handleDialogClose={() => setIsDialogOpen(false)}
            isDialogOpen={
              dialogCurrent.dialogItem === DialogList.Delete && isDialogOpen
            }
            dateItem={dialogCurrent.dateItem}
          />

          {/* update dialog */}
          <DatesDialogUpdate
            handleDialogClose={() => setIsDialogOpen(false)}
            isDialogOpen={
              dialogCurrent.dialogItem === DialogList.Update && isDialogOpen
            }
            dateItem={dialogCurrent.dateItem}
            dateList={data}
          />
        </Box>
      </Container>
    </>
  );
};
