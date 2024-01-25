import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  Switch,
  TextField,
} from "@mui/material";
import Image from "next/image";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import io from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IRoleItem {
  display: boolean;
  name: string;
}

interface IFormValues {
  name: string;
}

const socket = io();
const defaultValues: IFormValues = {
  name: "",
};
export const Roles = () => {
  const { data, error, mutate } = useSWR("/api/roles", fetcherGet);
  const { isMutating, trigger } = useSWRMutation("/api/roles", fetcherTrigger);
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on(
          "res-role-display-toggle",
          ({ checked, name }: { checked: boolean; name: string }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const roleItemUpdate = dataMutate.roleList.find(
                (roles: string) => roles === name
              );
              if (roleItemUpdate) {
                roleItemUpdate.display = checked;
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on("res-role-create", ({ name }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            dataMutate.roleList.push({
              name,
            });

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

  // handle on change
  const handleOnChange = async ({
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
          Display for <strong>{name}</strong> role has been set to{" "}
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
        filter: false,
        sort: false,
      },
    },
    {
      name: "Delete",
      options: {
        filter: false,
        sort: false,
      },
    },
  ];
  const dataTable = data.roleList.map(({ display, name }: IRoleItem) => {
    // if role name is admin
    // then disable actions
    if (name === "Admin") {
      return [
        name,
        <Switch disabled checked={display} key={`${name}-switch`} />,
        <IconButton disabled key={name}>
          <DeleteIcon color="disabled" />
        </IconButton>,
      ];
    }

    return [
      name,
      <Switch
        checked={display}
        onChange={(event) =>
          handleOnChange({
            checked: event.target.checked,
            name,
          })
        }
        key={`${name}-switch`}
      />,
      <IconButton key={`${name}-delete`}>
        <DeleteIcon color="primary" />
      </IconButton>,
    ];
  });
  const optionListCustom = {};

  // handle form submission
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const isRoleAvailable = data.roleList.some(
        ({ name }: { name: string }) => name === dataForm.name
      );

      // if the role has been added already
      // then display an error
      if (isRoleAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{dataForm.name}</strong> role has been added already
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }

      // update database
      await trigger({ body: dataForm, method: "POST" });
      // emit shift update
      socket.emit("req-role-create", {
        dataForm,
      });

      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{dataForm.name}</strong> role has been created
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
        <DataTable
          columnList={columnList}
          dataTable={dataTable}
          optionListCustom={optionListCustom}
        />
        <Card>
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextField
                    {...field}
                    autoComplete="off"
                    disabled={isMutating}
                    fullWidth
                    label="Name"
                    required
                    variant="standard"
                  />
                )}
              />
            </CardContent>
            <CardActions
              sx={{
                justifyContent: "flex-end",
                pb: 2,
                pt: 0,
                pr: 2,
              }}
            >
              <Button
                disabled={isMutating}
                startIcon={
                  isMutating ? <CircularProgress size="sm" /> : <AddIcon />
                }
                type="submit"
                variant="contained"
              >
                Create role
              </Button>
            </CardActions>
          </form>
        </Card>
      </Container>
    </>
  );
};
