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
import type { IResShiftTypeItem } from "src/components/types";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";
import { fetcherGet } from "src/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

export const ShiftTypes = () => {
  // context
  // --------------------
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/shifts/types", fetcherGet);

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
  const dataTable = data.map(
    ({ shiftTypeId, shiftTypeName }: IResShiftTypeItem) => {
      return [
        shiftTypeName,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${shiftTypeId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/shifts/types/update/${shiftTypeId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <EditCalendarIcon />
                  </ListItemIcon>
                  <ListItemText>Update type</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem>
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
  const optionListCustom = { filter: false };

  // display
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
        text="Shift types"
      />
      <Container component="main">
        <Box component="section">
          {isSuperAdmin && (
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
