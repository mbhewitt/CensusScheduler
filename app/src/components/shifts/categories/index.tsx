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
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import { ShiftCategoriesDialogCreate } from "src/components/shifts/categories/ShiftCategoriesDialogCreate";
import { ShiftCategoriesDialogDelete } from "src/components/shifts/categories/ShiftCategoriesDialogDelete";
import { ShiftCategoriesDialogUpdate } from "src/components/shifts/categories/ShiftCategoriesDialogUpdate";
import type { IResShiftCategoryItem } from "src/components/types";
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
    dialogItem: 0,
    shiftCategory: {
      category: "",
      id: 0,
      name: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/shifts/categories", fetcherGet);

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
      name: "Category - hidden", // hide for filter dialog
      label: "Category",
      options: {
        display: false,
      },
    },
    {
      name: "Category",
      options: {
        filter: false,
        sortThirdClickReset: true,
        sortCompare: (order: string) => {
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            category1: { [key: string]: any },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            category2: { [key: string]: any }
          ) => {
            const value1 = category1.data.props.label;
            const value2 = category2.data.props.label;

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
    ({ category, id, name }: IResShiftCategoryItem) => {
      return [
        name,
        category,
        <Chip
          key={`${category}-chip`}
          label={category}
          sx={{ backgroundColor: colorMapDisplay[category] }}
        />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${id}-menu`}
          MenuList={
            <MenuList>
              <MenuItem
                onClick={() => {
                  setDialogCurrent({
                    dialogItem: DialogList.Update,
                    shiftCategory: { category, id, name },
                  });
                  setIsDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <EditIcon />
                </ListItemIcon>
                <ListItemText>Update shift category</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setDialogCurrent({
                    dialogItem: DialogList.Delete,
                    shiftCategory: { category, id, name },
                  });
                  setIsDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <PlaylistRemoveIcon />
                </ListItemIcon>
                <ListItemText>Delete shift category</ListItemText>
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
        Image={
          <Image
            alt="census camp at burning man"
            fill
            priority
            src="/home/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Shift categories"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Create,
                  shiftCategory: {
                    category: "",
                    id: 0,
                    name: "",
                  },
                });
                setIsDialogOpen(true);
              }}
              startIcon={<PlaylistAddIcon />}
              type="button"
              variant="contained"
            >
              Create shift category
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
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Create && isDialogOpen
        }
        shiftCategoryItem={dialogCurrent.shiftCategory}
        shiftCategoryList={data}
      />

      {/* delete dialog */}
      <ShiftCategoriesDialogDelete
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Delete && isDialogOpen
        }
        shiftCategoryItem={dialogCurrent.shiftCategory}
      />

      {/* update dialog */}
      <ShiftCategoriesDialogUpdate
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Update && isDialogOpen
        }
        shiftCategoryItem={dialogCurrent.shiftCategory}
        shiftCategoryList={data}
      />
    </>
  );
};
