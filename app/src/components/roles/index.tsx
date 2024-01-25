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
  TextField,
} from "@mui/material";
import Image from "next/image";
import { useSnackbar } from "notistack";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
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

const defaultValues: IFormValues = {
  name: "",
};
export const Roles = () => {
  const { data, error } = useSWR("/api/roles", fetcherGet);
  const { isMutating, trigger } = useSWRMutation("/api/roles", fetcherTrigger);
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const { enqueueSnackbar } = useSnackbar();

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

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
        <IconButton disabled key={name}>
          {display ? (
            <VisibilityIcon color="disabled" />
          ) : (
            <VisibilityOffIcon color="primary" />
          )}
        </IconButton>,
        <IconButton disabled key={name}>
          <DeleteIcon color="disabled" />
        </IconButton>,
      ];
    }

    return [
      name,
      <IconButton key={name}>
        {display ? (
          <VisibilityIcon color="primary" />
        ) : (
          <VisibilityOffIcon color="primary" />
        )}
      </IconButton>,
      <IconButton key={name}>
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

      await trigger({ body: dataForm, method: "POST" });

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
