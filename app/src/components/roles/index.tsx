import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { Container, IconButton } from "@mui/material";
import Image from "next/image";
import useSWR from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { Hero } from "src/components/layout/Hero";
import { fetcherGet } from "src/utils/fetcher";

interface IRoleItem {
  display: boolean;
  name: string;
}

export const Roles = () => {
  const { data, error } = useSWR("/api/roles", fetcherGet);

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
      </Container>
    </>
  );
};
