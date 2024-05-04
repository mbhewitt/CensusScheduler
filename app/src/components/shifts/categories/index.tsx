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
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import useSWR from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import type { IResShiftCategoryItem } from "src/components/types";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";
import { fetcherGet } from "src/utils/fetcher";
import { getColorMap } from "src/utils/getColorMap";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

export const ShiftCategories = () => {
  // context
  // --------------------
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/shifts/categories", fetcherGet);

  // other hooks
  // --------------------
  const router = useRouter();

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const isSuperAdmin = checkIsSuperAdmin(roleList);

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
    ({ category, id, shiftCategory }: IResShiftCategoryItem) => {
      return [
        shiftCategory,
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
              <Link href={`/shifts/types/update/${id}`}>
                <MenuItem>
                  <ListItemIcon>
                    <EditIcon />
                  </ListItemIcon>
                  <ListItemText>Update category</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem>
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
          {isSuperAdmin && (
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
              <Button
                onClick={() => {
                  router.push("/shifts/categories/create");
                }}
                startIcon={<PlaylistAddIcon />}
                type="button"
                variant="contained"
              >
                Create category
              </Button>
            </Stack>
          )}
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
