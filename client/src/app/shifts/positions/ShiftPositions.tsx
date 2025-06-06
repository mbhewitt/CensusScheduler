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

import { ShiftPositionsDialogDelete } from "@/app/shifts/positions/ShiftPositionsDialogDelete";
import { DataTable } from "@/components/general/DataTable";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { MoreMenu } from "@/components/general/MoreMenu";
import { Hero } from "@/components/layout/Hero";
import type { IResShiftPositionRowItem } from "@/components/types/shifts/positions";
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

export const ShiftPositions = () => {
  // state
  // ------------------------------------------------------------
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    position: {
      id: 0,
      name: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: { data: IResShiftPositionRowItem[]; error: Error | undefined } = useSWR(
    "/api/shifts/positions",
    fetcherGet
  );

  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();
  const theme = useTheme();

  // logic
  // ------------------------------------------------------------
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
                <ListItemText>Update shift position</ListItemText>
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
              <ListItemText>Delete shift position</ListItemText>
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
      name: "Name",
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
              Create shift position
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
