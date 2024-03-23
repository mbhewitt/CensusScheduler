import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Groups3 as Groups3Icon,
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
  Switch,
} from "@mui/material";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import { RolesDialogCreate } from "src/components/roles/RolesDialogCreate";
import { RolesDialogDelete } from "src/components/roles/RolesDialogDelete";
import { RolesDialogUpdate } from "src/components/roles/RolesDialogUpdate";
import type { IResRoleItem } from "src/components/types";
import {
  ROLE_BEHAVIORAL_STANDARDS_ID,
  ROLE_CORE_CREW_ID,
  ROLE_SUPER_ADMIN_ID,
} from "src/constants";
import { fetcherGet } from "src/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

export const Roles = () => {
  const { data, error } = useSWR("/api/roles", fetcherGet);
  const { mutate } = useSWRConfig();
  const [isDialogCreateOpen, setIsDialogCreateOpen] = useState(false);
  const [isDialogUpdateOpen, setIsDialogUpdateOpen] = useState({
    isOpen: false,
    role: {
      display: true,
      roleId: 0,
      roleName: "",
    },
  });
  const [isDialogDeleteOpen, setIsDialogDeleteOpen] = useState({
    isOpen: false,
    role: {
      display: true,
      roleId: 0,
      roleName: "",
    },
  });
  const { enqueueSnackbar } = useSnackbar();

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // handle display toggle
  const handleDisplayToggle = async ({
    checked,
    roleId,
    roleName,
  }: {
    checked: boolean;
    roleId: number;
    roleName: string;
  }) => {
    try {
      // update database
      // workaround to handle dynamic routing
      await axios.patch(`/api/roles/${roleId}/display`, {
        checked,
      });
      mutate("/api/roles");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{roleName}</strong> role display has been set to{" "}
          <strong>{checked ? "on" : "off"}</strong>
        </SnackbarText>,
        {
          variant: "success",
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
      }

      throw error;
    }
  };
  // prepare datatable
  const columnList = [
    {
      name: "Role ID - hidden", // hide for row click
      options: {
        display: false,
        filter: false,
      },
    },
    {
      name: "Name",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Display",
      options: {
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sort: false,
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
  const dataTable = data.map(({ display, roleId, roleName }: IResRoleItem) => {
    // if role ID is super admin, core crew, or behavioral standards
    // then disable actions
    if (
      roleId === ROLE_SUPER_ADMIN_ID ||
      roleId === ROLE_CORE_CREW_ID ||
      roleId === ROLE_BEHAVIORAL_STANDARDS_ID
    ) {
      return [
        roleId,
        roleName,
        <Switch disabled checked={display} key={`${roleId}-switch`} />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${roleId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/role-volunteers/${roleId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <Groups3Icon />
                  </ListItemIcon>
                  <ListItemText>View volunteers</ListItemText>
                </MenuItem>
              </Link>
            </MenuList>
          }
        />,
      ];
    }

    return [
      roleId,
      roleName,
      <Switch
        checked={display}
        onChange={(event) =>
          handleDisplayToggle({
            checked: event.target.checked,
            roleId,
            roleName,
          })
        }
        key={`${roleId}-switch`}
      />,
      <MoreMenu
        Icon={<MoreHorizIcon />}
        key={`${roleId}-menu`}
        MenuList={
          <MenuList>
            <Link href={`/role-volunteers/${roleId}`}>
              <MenuItem>
                <ListItemIcon>
                  <Groups3Icon />
                </ListItemIcon>
                <ListItemText>View volunteers</ListItemText>
              </MenuItem>
            </Link>
            <MenuItem
              onClick={() =>
                setIsDialogUpdateOpen({
                  isOpen: true,
                  role: { display, roleId, roleName },
                })
              }
            >
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText>Update</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() =>
                setIsDialogDeleteOpen({
                  isOpen: true,
                  role: { display, roleId, roleName },
                })
              }
            >
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </MenuList>
        }
      />,
    ];
  });
  const optionListCustom = { filter: false };

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
        text="Roles"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                setIsDialogCreateOpen(true);
              }}
              startIcon={<AddIcon />}
              type="button"
              variant="contained"
            >
              Create
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
      <RolesDialogCreate
        handleDialogCreateClose={() => setIsDialogCreateOpen(false)}
        isDialogCreateOpen={isDialogCreateOpen}
        roleList={data}
      />

      {/* update dialog */}
      <RolesDialogUpdate
        handleDialogUpdateClose={() =>
          setIsDialogUpdateOpen({
            isOpen: false,
            role: {
              display: true,
              roleId: 0,
              roleName: "",
            },
          })
        }
        isDialogUpdateOpen={isDialogUpdateOpen.isOpen}
        role={isDialogUpdateOpen.role}
        roleList={data}
      />

      {/* delete dialog */}
      <RolesDialogDelete
        handleDialogDeleteClose={() =>
          setIsDialogDeleteOpen({
            isOpen: false,
            role: {
              display: true,
              roleId: 0,
              roleName: "",
            },
          })
        }
        isDialogDeleteOpen={isDialogDeleteOpen.isOpen}
        role={isDialogDeleteOpen.role}
      />
    </>
  );
};
