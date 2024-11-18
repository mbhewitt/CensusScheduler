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
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { RolesDialogCreate } from "src/app/roles/RolesDialogCreate";
import { RolesDialogDelete } from "src/app/roles/RolesDialogDelete";
import { RolesDialogUpdate } from "src/app/roles/RolesDialogUpdate";
import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import type {
  IReqRoleDisplayItem,
  IResRoleRowItem,
} from "src/components/types/roles";
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

enum DialogList {
  Create,
  Delete,
  Update,
}
interface IRoleDisplay {
  checked: boolean;
  id: number;
  name: string;
}

export const Roles = () => {
  // state
  // --------------------
  const [dialogCurrent, setDialogCurrent] = useState({
    dialogItem: 0,
    role: {
      display: true,
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
  }: {
    data: IResRoleRowItem[];
    error: Error | undefined;
  } = useSWR("/api/roles", fetcherGet);
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
      const body: IReqRoleDisplayItem = {
        checked,
      };

      // update database
      // workaround to handle dynamic routing
      await axios.patch(`/api/roles/${id}/display`, {
        checked: body.checked,
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
  const dataTable = data.map(({ display, id, name }) => {
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
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Update,
                  role: { display, id, name },
                });
                setIsDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText>Update role</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Delete,
                  role: { display, id, name },
                });
                setIsDialogOpen(true);
              }}
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
        imageStyles={{
          backgroundImage: "url(/banners/storage.jpg)",
          backgroundSize: "cover",
        }}
        text="Roles"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              onClick={() => {
                setDialogCurrent({
                  dialogItem: DialogList.Create,
                  role: {
                    display: true,
                    id: 0,
                    name: "",
                  },
                });
                setIsDialogOpen(true);
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
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Create && isDialogOpen
        }
        roleList={data}
      />

      {/* delete dialog */}
      <RolesDialogDelete
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Delete && isDialogOpen
        }
        roleItem={dialogCurrent.role}
      />

      {/* update dialog */}
      <RolesDialogUpdate
        handleDialogClose={() => setIsDialogOpen(false)}
        isDialogOpen={
          dialogCurrent.dialogItem === DialogList.Update && isDialogOpen
        }
        roleItem={dialogCurrent.role}
        roleList={data}
      />
    </>
  );
};
