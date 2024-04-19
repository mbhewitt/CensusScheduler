import {
  Groups3 as Groups3Icon,
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz as MoreHorizIcon,
  PersonAdd as PersonAddIcon,
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

export const RoleVolunteers = () => {
  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogAddOpen, setIsDialogAddOpen] = useState(false);
  const [isDialogRemoveOpen, setIsDialogRemoveOpen] = useState({
    isOpen: false,
    volunteer: {
      playaName: "",
      roleId: 0,
      roleName: "",
      shiftboardId: 0,
      worldName: "",
    },
  });

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
    ({
      playaName,
      roleId,
      roleName,
      shiftboardId,
      worldName,
    }: IResRoleVolunteerItem) => {
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
                onClick={() =>
                  setIsDialogRemoveOpen({
                    isOpen: true,
                    volunteer: {
                      playaName,
                      roleId,
                      roleName,
                      shiftboardId,
                      worldName,
                    },
                  })
                }
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

  // display
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
                  textDecoration: "underline",
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
                {dataRoleItem.roleName}
              </Typography>
            </Box>
            <Button
              onClick={() => {
                setIsDialogAddOpen(true);
              }}
              startIcon={<PersonAddIcon />}
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
        handleDialogAddClose={() => setIsDialogAddOpen(false)}
        isDialogAddOpen={isDialogAddOpen}
        roleId={roleId}
        roleName={dataRoleItem.roleName}
        roleVolunteerList={dataRoleVolunteerList}
      />

      {/* remove dialog */}
      <RoleVolunteersDialogRemove
        handleDialogRemoveClose={() =>
          setIsDialogRemoveOpen({
            isOpen: false,
            volunteer: {
              playaName: "",
              roleId: 0,
              roleName: "",
              shiftboardId: 0,
              worldName: "",
            },
          })
        }
        isDialogRemoveOpen={isDialogRemoveOpen.isOpen}
        volunteer={isDialogRemoveOpen.volunteer}
      />
    </>
  );
};
