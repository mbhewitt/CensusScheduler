import {
  Groups3 as Groups3Icon,
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz as MoreHorizIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
  PersonRemove as PersonRemoveIcon,
  VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import { RoleVolunteersDialogAdd } from "src/components/roles/volunteers/RoleVolunteersDialogAdd";
import { RoleVolunteersDialogRemove } from "src/components/roles/volunteers/RoleVolunteersDialogRemove";
import type { IResRoleVolunteerItem } from "src/components/types";
import { fetcherGet } from "src/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

enum DialogList {
  Add,
  Remove,
}

export const RoleVolunteers = () => {
  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    role: {
      id: 0,
      name: "",
    },
    volunteer: {
      playaName: "",
      shiftboardId: 0,
      worldName: "",
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { roleId } = router.query;
  const { data: dataRoleItem, error: errorRoleItem } = useSWR(
    isMounted ? `/api/roles/${roleId}` : null,
    fetcherGet
  );
  const { data: dataRoleVolunteerList, error: errorRoleVolunteerList } = useSWR(
    isMounted ? `/api/roles/volunteers/${roleId}` : null,
    fetcherGet
  );

  // side effects
  // --------------------
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);

  // logic
  // --------------------
  if (errorRoleItem || errorRoleVolunteerList) return <ErrorPage />;
  if (!dataRoleItem || !dataRoleVolunteerList) return <Loading />;

  // prepare datatable
  const columnList = [
    {
      name: "Shiftboard ID - hidden",
      options: { display: false },
    },
    {
      name: "Playa name",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "World name",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Actions",
      options: {
        searchable: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
      },
    },
  ];
  const dataTable = dataRoleVolunteerList.map(
    ({ playaName, shiftboardId, worldName }: IResRoleVolunteerItem) => {
      return [
        shiftboardId,
        playaName,
        worldName,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${shiftboardId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/volunteers/account/${shiftboardId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <ManageAccountsIcon />
                  </ListItemIcon>
                  <ListItemText>View account</ListItemText>
                </MenuItem>
              </Link>
              <MenuItem
                onClick={() => {
                  setDialogCurrent({
                    dialogItem: DialogList.Remove,
                    role: {
                      id: dataRoleItem.id,
                      name: dataRoleItem.name,
                    },
                    volunteer: {
                      playaName,
                      shiftboardId,
                      worldName,
                    },
                  });
                  setIsDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <PersonRemoveIcon />
                </ListItemIcon>
                <ListItemText>Remove volunteer</ListItemText>
              </MenuItem>
            </MenuList>
          }
        />,
      ];
    }
  );
  const optionListCustom = { filter: false };

  // render
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="temple burning"
            fill
            priority
            src="/reports/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Role volunteers"
      />
      <Container component="main" sx={{ flex: 1 }}>
        <Box component="section">
          <Breadcrumbs>
            <Link href="/roles">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <VerifiedUserIcon sx={{ mr: 0.5 }} />
                Roles
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <Groups3Icon sx={{ mr: 0.5 }} />
              Role volunteers
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box component="section">
          <Stack
            alignItems="flex-end"
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography component="h2" variant="h4">
                {dataRoleItem.name}
              </Typography>
            </Box>
            <Button
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Add,
                  role: {
                    id: 0,
                    name: "",
                  },
                  volunteer: {
                    playaName: "",
                    shiftboardId: 0,
                    worldName: "",
                  },
                });
                setIsDialogOpen(true);
              }}
              startIcon={<PersonAddAlt1Icon />}
              type="button"
              variant="contained"
            >
              Add volunteer
            </Button>
          </Stack>
          <DataTable
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
          />
        </Box>
      </Container>

      {/* add dialog */}
      <RoleVolunteersDialogAdd
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Add && isDialogOpen
        }
        roleItem={dataRoleItem}
        roleVolunteerList={dataRoleVolunteerList}
      />

      {/* remove dialog */}
      <RoleVolunteersDialogRemove
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Remove && isDialogOpen
        }
        roleItem={dataRoleItem}
        volunteerItem={dialogCurrent.volunteer}
      />
    </>
  );
};
