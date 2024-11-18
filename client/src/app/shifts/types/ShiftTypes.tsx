import {
  EditCalendar as EditCalendarIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import { ShiftTypesDialogDelete } from "src/app/shifts/types/ShiftTypesDialogDelete";
import type { IResShiftTypeRowItem } from "src/components/types/shifts/types";
import { fetcherGet } from "src/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

enum DialogList {
  Delete,
}

export const ShiftTypes = () => {
  // state
  // --------------------
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    type: {
      category: { name: "" },
      id: 0,
      name: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResShiftTypeRowItem[];
    error: Error | undefined;
  } = useSWR("/api/shifts/types", fetcherGet);

  // other hooks
  // --------------------
  const router = useRouter();
  const theme = useTheme();

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // prepare datatable
  const columnList = [
    {
      name: "Name",
      options: {
        filter: false,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Category",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Actions",
      options: {
        filter: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
  ];
  const dataTable = data.map(
    ({
      category: { name: categoryName },
      id: typeId,
      name: typeName,
    }: IResShiftTypeRowItem) => {
      return [
        typeName,
        categoryName,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${typeId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/shifts/types/update/${typeId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <EditCalendarIcon />
                  </ListItemIcon>
                  <ListItemText>Update type</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem
                onClick={() => {
                  setDialogCurrent({
                    dialogItem: DialogList.Delete,
                    type: {
                      category: { name: categoryName },
                      id: typeId,
                      name: typeName,
                    },
                  });
                  setIsDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <EventBusyIcon />
                </ListItemIcon>
                <ListItemText>Delete type</ListItemText>
              </MenuItem>
            </MenuList>
          }
        />,
      ];
    }
  );
  const optionListCustom = {};

  // render
  // --------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Shift types"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                router.push("/shifts/types/create");
              }}
              startIcon={<EventAvailableIcon />}
              type="button"
              variant="contained"
            >
              Create type
            </Button>
          </Stack>
          <DataTable
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
          />
        </Box>
      </Container>

      {/* delete dialog */}
      <ShiftTypesDialogDelete
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Delete && isDialogOpen
        }
        typeItem={dialogCurrent.type}
      />
    </>
  );
};
