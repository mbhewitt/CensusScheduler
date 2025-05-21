"use client";

import {
  EditCalendar as EditCalendarIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import {
  Button,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

import { DatesDialogCreate } from "@/app/calendar/dates/DatesDialogCreate";
// import { DatesDialogDelete } from "@/app/calendar/dates/DatesDialogDelete";
// import { DatesDialogUpdate } from "@/app/calendar/dates/DatesDialogUpdate";
import { DataTable } from "@/components/general/DataTable";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { MoreMenu } from "@/components/general/MoreMenu";
import { IResDateRowItem } from "@/components/types/calendar/dates";
import { fetcherGet } from "@/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "@/utils/setCellPropsCenter";

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
    useSWR("/api/calendar/dates", fetcherGet);

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
      date,
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
  const optionListCustom = { filter: false };

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Stack
        alignItems="flex-end"
        direction="row"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography component="h2" variant="h4">
          Dates
        </Typography>
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
      {/* <DatesDialogDelete
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Delete && isDialogOpen
        }
        dateItem={dialogCurrent.dateItem}
      /> */}

      {/* update dialog */}
      {/* <DatesDialogUpdate
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Update && isDialogOpen
        }
        dateItem={dialogCurrent.dateItem}
        dateList={data}
      /> */}
    </>
  );
};
