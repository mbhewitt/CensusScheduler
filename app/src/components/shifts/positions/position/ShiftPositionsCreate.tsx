import {
  Close as CloseIcon,
  GroupAdd as GroupAddIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import {
  defaultValues,
  findList,
  IFormValues,
  ShiftPositionsForm,
} from "src/components/shifts/positions/position/ShiftPositionsForm";
import { IReqShiftPositionItem } from "src/components/types/shifts/positions";
import type { IResShiftPositionDefaults } from "src/components/types/shifts/positions";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

export const ShiftPositionsCreate = () => {
  // fetching, mutation, and revalidation
  // --------------------
  const {
    data: dataDefaults,
    error: errorDefaults,
  }: {
    data: IResShiftPositionDefaults;
    error: Error | undefined;
  } = useSWR("/api/shifts/positions/defaults", fetcherGet);
  const { isMutating, trigger } = useSWRMutation(
    "/api/shifts/positions",
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // logic
  // --------------------
  if (errorDefaults) return <ErrorPage />;
  if (!dataDefaults) return <Loading />;

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const [prerequisiteIdFound, roleIdFound] = findList(
        dataDefaults,
        formValues
      );
      const body: IReqShiftPositionItem = {
        critical: formValues.critical,
        details: formValues.details,
        endTimeOffset: formValues.endTimeOffset,
        lead: formValues.lead,
        name: formValues.name,
        prerequisite: {
          id: prerequisiteIdFound,
        },
        role: {
          id: roleIdFound,
        },
        startTimeOffset: formValues.startTimeOffset,
      };

      // update database
      await trigger({
        body,
        method: "POST",
      });
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            <strong>{formValues.name}</strong>
          </strong>{" "}
          position has been created
        </SnackbarText>,
        {
          variant: "success",
        }
      );
      // route to positions page
      router.push("/shifts/positions");
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

  // render
  // --------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundColor: theme.palette.primary.light,
          backgroundImage: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
        text="Create shift position"
      />
      <Container component="main">
        <Box component="section">
          <Breadcrumbs>
            <Link href="/shifts/positions">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <GroupIcon sx={{ mr: 0.5 }} />
                Shift positions
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <GroupAddIcon sx={{ mr: 0.5 }} />
              Create position
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box component="section">
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <ShiftPositionsForm
              control={control}
              dataDefaults={dataDefaults}
              errors={errors}
              positionName={defaultValues.name}
            />

            {/* actions */}
            <Card>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  p: 2,
                }}
              >
                <Button
                  disabled={isMutating}
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    router.push("/shifts/positions");
                  }}
                  type="button"
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  disabled={Object.keys(errors).length > 0 || isMutating}
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <GroupAddIcon />
                    )
                  }
                  type="submit"
                  variant="contained"
                >
                  Create position
                </Button>
              </CardActions>
            </Card>
          </form>
        </Box>
      </Container>
    </>
  );
};
