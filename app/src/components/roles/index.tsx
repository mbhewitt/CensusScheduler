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
import Image from "next/image";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import { RolesDialogCreate } from "src/components/roles/RolesDialogCreate";
import { RolesDialogDelete } from "src/components/roles/RolesDialogDelete";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IRoleItem {
  display: boolean;
  name: string;
}

const socket = io();
export const Roles = () => {
  const { data, error, mutate } = useSWR("/api/roles", fetcherGet);
  const { trigger } = useSWRMutation("/api/roles", fetcherTrigger);
  const [isDialogCreateOpen, setIsDialogCreateOpen] = useState(false);
  const [isDialogDeleteOpen, setIsDialogDeleteOpen] = useState({
    isOpen: false,
    role: {
      name: "",
    },
  });
  const { enqueueSnackbar } = useSnackbar();

  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on("res-role-create", ({ name }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            dataMutate.push({
              name,
            });

            mutate(dataMutate);
          }
        });
        socket.on(
          "res-role-display-toggle",
          ({ checked, name }: { checked: boolean; name: string }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const roleItemUpdate = dataMutate.find(
                (roles: string) => roles === name
              );
              if (roleItemUpdate) {
                roleItemUpdate.display = checked;
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on("res-role-delete", ({ name }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            const roleListNew = dataMutate.filter(
              (roleItem: IRoleItem) => roleItem.name !== name
            );

            mutate(roleListNew);
          }
        });
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
    })();
  }, [data, enqueueSnackbar, mutate]);

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // handle display toggle
  const handleDisplayToggle = async ({
    checked,
    name,
  }: {
    checked: boolean;
    name: string;
  }) => {
    try {
      await trigger({
        body: {
          checked,
          name,
        },
        method: "PATCH",
      });
      socket.emit("req-role-display-toggle", {
        checked,
        name,
      });
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
  const dataTable = data.map(({ display, name }: IRoleItem) => {
    // if role name is admin
    // then disable display and delete actions
    if (name === "Admin") {
      return [
        name,
        <Switch disabled checked={display} key={`${name}-switch`} />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${name}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/roles/${encodeURI(name)}`}>
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
      name,
      <Switch
        checked={display}
        onChange={(event) =>
          handleDisplayToggle({
            checked: event.target.checked,
            name,
          })
        }
        key={`${name}-switch`}
      />,
      <MoreMenu
        Icon={<MoreHorizIcon />}
        key={`${name}-menu`}
        MenuList={
          <MenuList>
            <Link href={`/roles/${encodeURI(name)}`}>
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
                  role: { name },
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
              name: "",
            },
          })
        }
        isDialogDeleteOpen={isDialogDeleteOpen.isOpen}
        role={isDialogDeleteOpen.role}
      />
    </>
  );
};
