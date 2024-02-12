import {
  Groups3 as Groups3Icon,
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz as MoreHorizIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Verified as VerifiedIcon,
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
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import useSWR from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import { RoleVolunteersDialogRemove } from "src/components/role-volunteers/RoleVolunteersDialogRemove";
import { fetcherGet } from "src/utils/fetcher";

interface IDataVolunteerItem {
  playaName: string;
  roleName: string;
  shiftboardId: number;
  worldName: string;
}

const socket = io();
export const RoleVolunteers = () => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { roleName } = router.query;
  const { data, error, mutate } = useSWR(
    isMounted ? `/api/roles/${encodeURI(roleName as string)}` : null,
    fetcherGet
  );
  const [isDialogAddOpen, setIsDialogAddOpen] = useState(false);
  const [isDialogRemoveOpen, setIsDialogRemoveOpen] = useState({
    isOpen: false,
    volunteer: {
      playaName: "",
      roleName: "",
      shiftboardId: 0,
      worldName: "",
    },
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);

  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on("res-role-volunteer-remove", ({ shiftboardId }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            const roleVolunteerListNew =
              dataMutate.dataRoleVolunteerList.filter(
                (roleVolunteerItem: IDataVolunteerItem) =>
                  roleVolunteerItem.shiftboardId !== shiftboardId
              );
            dataMutate.dataRoleVolunteerList = roleVolunteerListNew;

            mutate(dataMutate);
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
      options: { searchable: false, sort: false },
    },
  ];
  const dataTable = data.dataRoleVolunteerList.map(
    ({ playaName, roleName, shiftboardId, worldName }: IDataVolunteerItem) => {
      return [
        shiftboardId,
        playaName,
        worldName,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${shiftboardId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/volunteers/${shiftboardId}`}>
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
                <ListItemText>Remove</ListItemText>
              </MenuItem>
            </MenuList>
          }
        />,
      ];
    }
  );
  const optionListCustom = { filter: false };

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
                <VerifiedIcon sx={{ mr: 0.5 }} />
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
                {roleName}
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
              Add
            </Button>
          </Stack>
          <DataTable
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
          />
        </Box>
      </Container>

      {/* remove dialog */}
      <RoleVolunteersDialogRemove
        handleDialogRemoveClose={() =>
          setIsDialogRemoveOpen({
            isOpen: false,
            volunteer: {
              playaName: "",
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
