import {
  Add as AddIcon,
  Delete as DeleteIcon,
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
import { IRoleItem } from "src/components/types";
import { SUPER_ADMIN_ID } from "src/constants";
import { fetcherGet } from "src/utils/fetcher";

export const Roles = () => {
  const { data, error } = useSWR("/api/roles", fetcherGet);
  const { mutate } = useSWRConfig();
  const [isDialogCreateOpen, setIsDialogCreateOpen] = useState(false);
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
      await axios.patch(`/api/roles/${roleId}`, {
        checked,
        roleId,
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
        sort: false,
      },
    },
    {
      name: "Actions",
      options: {
        sort: false,
      },
    },
  ];
  const dataTable = data.map(({ display, roleId, roleName }: IRoleItem) => {
    // if role ID is super admin
    // then disable display and delete actions
    if (roleId === SUPER_ADMIN_ID) {
      return [
        roleId,
        roleName,
        <Switch disabled checked={display} key={`${roleId}-switch`} />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${roleId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/roles/${roleId}`}>
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
            <Link href={`/roles/${roleId}`}>
              <MenuItem>
                <ListItemIcon>
                  <Groups3Icon />
                </ListItemIcon>
                <ListItemText>View volunteers</ListItemText>
              </MenuItem>
            </Link>
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
