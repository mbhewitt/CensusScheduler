"use client";

import {
  Edit as EditIcon,
  GroupAdd as GroupAddIcon,
  GroupRemove as GroupRemoveIcon,
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

import { ShiftPositionsDialogDelete } from "src/app/shifts/positions/ShiftPositionsDialogDelete";
import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import type { IResShiftPositionRowItem } from "src/components/types/shifts/positions";
import { fetcherGet } from "src/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

enum DialogList {
  Create,
  Delete,
  Update,
}

export const ShiftPositions = () => {
  // state
  // --------------------
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    position: {
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
  }: { data: IResShiftPositionRowItem[]; error: Error | undefined } = useSWR(
    "/api/shifts/positions",
    fetcherGet
  );

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
  const dataTable = data.map(({ id, name }) => {
    return [
      name,
      <MoreMenu
        Icon={<MoreHorizIcon />}
        key={`${id}-menu`}
        MenuList={
          <MenuList>
            <Link href={`/shifts/positions/update/${id}`}>
              <MenuItem>
                <ListItemIcon>
                  <EditIcon />
                </ListItemIcon>
                <ListItemText>Update position</ListItemText>
              </MenuItem>
            </Link>
            <MenuItem
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Delete,
                  position: { id, name },
                });
                setIsDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <GroupRemoveIcon />
              </ListItemIcon>
              <ListItemText>Delete position</ListItemText>
            </MenuItem>
          </MenuList>
        }
      />,
    ];
  });
  const optionListCustom = { filter: false };

  // render
  // --------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Shift positions"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                router.push("/shifts/positions/create");
              }}
              startIcon={<GroupAddIcon />}
              type="button"
              variant="contained"
            >
              Create position
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
      <ShiftPositionsDialogDelete
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Delete && isDialogOpen
        }
        positionItem={dialogCurrent.position}
      />
    </>
  );
};
