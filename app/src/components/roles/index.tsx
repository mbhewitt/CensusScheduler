import {
  AddModerator as AddModeratorIcon,
  Edit as EditIcon,
  Groups3 as Groups3Icon,
  MoreHoriz as MoreHorizIcon,
  RemoveModerator as RemoveModeratorIcon,
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
  ROLE_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  ROLE_CORE_CREW_ID,
  ROLE_SUPER_ADMIN_ID,
} from "src/constants";
import { fetcherGet } from "src/utils/fetcher";
import {
  setCellHeaderPropsCenter,
  setCellPropsCenter,
} from "src/utils/setCellPropsCenter";

interface IRoleDisplay {
  checked: boolean;
  id: number;
  name: string;
}

const defaultState = {
  isOpen: false,
  role: {
    display: true,
    id: 0,
    name: "",
  },
};
export const Roles = () => {
  // state
  // --------------------
  const [isDialogCreateOpen, setIsDialogCreateOpen] = useState(false);
  const [isDialogUpdateOpen, setIsDialogUpdateOpen] = useState(
    structuredClone(defaultState)
  );
  const [isDialogDeleteOpen, setIsDialogDeleteOpen] = useState(
    structuredClone(defaultState)
  );

  // fetching, mutation, and revalidation
  // --------------------
  const { data, error } = useSWR("/api/roles", fetcherGet);
  const { mutate } = useSWRConfig();

  // other hooks
  // --------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // --------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const handleDisplayToggle = async ({ checked, id, name }: IRoleDisplay) => {
    try {
      // update database
      // workaround to handle dynamic routing
      await axios.patch(`/api/roles/${id}/display`, {
        checked,
      });
      mutate("/api/roles");

      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> role display has been set to{" "}
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
  const dataTable = data.map(({ display, id, name }: IResRoleItem) => {
    // if role ID is super admin, admin, or behavioral standards
    // then disable actions
    if (
      id === ROLE_ADMIN_ID ||
      id === ROLE_CORE_CREW_ID ||
      id === ROLE_BEHAVIORAL_STANDARDS_ID ||
      id === ROLE_SUPER_ADMIN_ID
    ) {
      return [
        name,
        <Switch disabled checked={display} key={`${id}-switch`} />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${id}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/roles/volunteers/${id}`}>
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

    // else display normal row
    return [
      name,
      <Switch
        checked={display}
        onChange={(event) =>
          handleDisplayToggle({
            checked: event.target.checked,
            id,
            name,
          })
        }
        key={`${id}-switch`}
      />,
      <MoreMenu
        Icon={<MoreHorizIcon />}
        key={`${id}-menu`}
        MenuList={
          <MenuList>
            <Link href={`/roles/volunteers/${id}`}>
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
                  role: { display, id, name },
                })
              }
            >
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText>Update role</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() =>
                setIsDialogDeleteOpen({
                  isOpen: true,
                  role: { display, id, name },
                })
              }
            >
              <ListItemIcon>
                <RemoveModeratorIcon />
              </ListItemIcon>
              <ListItemText>Delete role</ListItemText>
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
              startIcon={<AddModeratorIcon />}
              type="button"
              variant="contained"
            >
              Create role
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
          setIsDialogUpdateOpen(structuredClone(defaultState))
        }
        isDialogUpdateOpen={isDialogUpdateOpen.isOpen}
        roleItem={isDialogUpdateOpen.role}
        roleList={data}
      />

      {/* delete dialog */}
      <RolesDialogDelete
        handleDialogDeleteClose={() =>
          setIsDialogDeleteOpen(structuredClone(defaultState))
        }
        isDialogDeleteOpen={isDialogDeleteOpen.isOpen}
        roleItem={isDialogDeleteOpen.role}
      />
    </>
  );
};
