"use client";

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
import Link from "next/link";
import { useContext, useState } from "react";
import useSWR from "swr";

import { RoleVolunteersDialogAdd } from "src/app/roles/volunteers/[roleId]/RoleVolunteersDialogAdd";
import { RoleVolunteersDialogRemove } from "src/app/roles/volunteers/[roleId]/RoleVolunteersDialogRemove";
import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import type {
  IResRoleRowItem,
  IResRoleVolunteerItem,
} from "src/components/types/roles";
import { ROLE_SUPER_ADMIN_ID } from "src/constants";
import { SessionContext } from "src/state/session/context";
import { checkIsSuperAdmin } from "src/utils/checkIsRoleExist";
import { fetcherGet } from "src/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

enum DialogList {
  Add,
  Remove,
}
interface IRoleVolunteersProps {
  roleId: string;
}

export const RoleVolunteers = ({ roleId }: IRoleVolunteersProps) => {
  // context
  // --------------------
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // state
  // --------------------
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
  const {
    data: dataRoleItem,
    error: errorRoleItem,
  }: {
    data: IResRoleRowItem;
    error: Error | undefined;
  } = useSWR(`/api/roles/${roleId}`, fetcherGet);
  const {
    data: dataRoleVolunteerList,
    error: errorRoleVolunteerList,
  }: {
    data: IResRoleVolunteerItem[];
    error: Error | undefined;
  } = useSWR(`/api/roles/volunteers/${roleId}`, fetcherGet);

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
    ({ playaName, shiftboardId, worldName }) => {
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
              {shiftboardId !== ROLE_SUPER_ADMIN_ID && (
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
              )}
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
        imageStyles={{
          backgroundImage: "url(/banners/databeast-volunteers-riding.jpg)",
          backgroundSize: "cover",
        }}
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
            {(Number(roleId) !== ROLE_SUPER_ADMIN_ID ||
              checkIsSuperAdmin(roleList)) && (
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
            )}
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
