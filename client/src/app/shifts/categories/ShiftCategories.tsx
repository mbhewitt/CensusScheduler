"use client";

import {
  Edit as EditIcon,
  MoreHoriz as MoreHorizIcon,
  PlaylistAdd as PlaylistAddIcon,
  PlaylistRemove as PlaylistRemoveIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Container,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

import { ShiftCategoriesDialogCreate } from "src/app/shifts/categories/ShiftCategoriesDialogCreate";
import { ShiftCategoriesDialogDelete } from "src/app/shifts/categories/ShiftCategoriesDialogDelete";
import { ShiftCategoriesDialogUpdate } from "src/app/shifts/categories/ShiftCategoriesDialogUpdate";
import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import type { IResShiftCategoryItem } from "src/components/types/shifts/categories";
import { fetcherGet } from "src/utils/fetcher";
import { getColorMap } from "src/utils/getColorMap";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

enum DialogList {
  Create,
  Delete,
  Update,
}

export const ShiftCategories = () => {
  // state
  // --------------------
  const [dialogCurrent, setDialogCurrent] = useState({
    category: {
      department: { name: "" },
      id: 0,
      name: "",
    },
    dialogItem: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const {
    data,
    error,
  }: {
    data: IResShiftCategoryItem[];
    error: Error | undefined;
  } = useSWR("/api/shifts/categories", fetcherGet);

  // other hooks
  // --------------------
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
      name: "Department - hidden", // hide for filter dialog
      label: "Department",
      options: {
        display: false,
      },
    },
    {
      name: "Department",
      options: {
        filter: false,
        sortThirdClickReset: true,
        sortCompare: (order: string) => {
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            department1: { [key: string]: any },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            department2: { [key: string]: any }
          ) => {
            const value1 = department1.data.props.label;
            const value2 = department2.data.props.label;

            return value1 > value2 && order === "asc" ? 1 : -1;
          };
        },
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
  const colorMapDisplay = getColorMap(data);
  const dataTable = data.map(
    ({
      department: { name: departmentName },
      id: categoryId,
      name: categoryName,
    }) => {
      return [
        categoryName,
        departmentName,
        <Chip
          key={`${departmentName}-chip`}
          label={departmentName}
          sx={{ backgroundColor: colorMapDisplay[departmentName] }}
        />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${categoryId}-menu`}
          MenuList={
            <MenuList>
              <MenuItem
                onClick={() => {
                  setDialogCurrent({
                    category: {
                      department: { name: departmentName },
                      id: categoryId,
                      name: categoryName,
                    },
                    dialogItem: DialogList.Update,
                  });
                  setIsDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <EditIcon />
                </ListItemIcon>
                <ListItemText>Update category</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setDialogCurrent({
                    category: {
                      department: { name: departmentName },
                      id: categoryId,
                      name: categoryName,
                    },
                    dialogItem: DialogList.Delete,
                  });
                  setIsDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <PlaylistRemoveIcon />
                </ListItemIcon>
                <ListItemText>Delete category</ListItemText>
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
        text="Shift categories"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                setDialogCurrent({
                  category: {
                    department: { name: "" },
                    id: 0,
                    name: "",
                  },
                  dialogItem: DialogList.Create,
                });
                setIsDialogOpen(true);
              }}
              startIcon={<PlaylistAddIcon />}
              type="button"
              variant="contained"
            >
              Create category
            </Button>
          </Stack>
          <DataTable
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
          />
        </Box>
      </Container>

      {/* create dialog */}
      <ShiftCategoriesDialogCreate
        categoryItem={dialogCurrent.category}
        categoryList={data}
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Create && isDialogOpen
        }
      />

      {/* delete dialog */}
      <ShiftCategoriesDialogDelete
        categoryItem={dialogCurrent.category}
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Delete && isDialogOpen
        }
      />

      {/* update dialog */}
      <ShiftCategoriesDialogUpdate
        categoryItem={dialogCurrent.category}
        categoryList={data}
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Update && isDialogOpen
        }
      />
    </>
  );
};
