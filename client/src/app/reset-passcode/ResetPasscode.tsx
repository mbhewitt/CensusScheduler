"use client";

import { LockReset as LockResetIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useContext, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";

import { PasscodeDialogUpdate } from "@/app/volunteers/[shiftboardId]/account/PasscodeDialogUpdate";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import {
  checkIsAdmin,
  checkIsPeersCoordinator,
  checkIsPeersShiftLead,
} from "@/utils/checkIsRoleExist";
import { fetcherGet } from "@/utils/fetcher";
import { useIsOnPlaya } from "@/utils/useIsOnPlaya";

interface IManageableVolunteer {
  playaName: string;
  shiftboardId: number;
  worldName: string;
}
interface IVolunteerOption {
  label: string;
  playaName: string;
  shiftboardId: number;
  worldName: string;
}
interface IFormValues {
  volunteer: IVolunteerOption | null;
}

const defaultValues: IFormValues = {
  volunteer: null,
};
export const ResetPasscode = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // state
  // ------------------------------------------------------------
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] =
    useState<IVolunteerOption | null>(null);

  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();
  const isOnPlaya = useIsOnPlaya();
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({ defaultValues, mode: "onBlur" });

  // A leader = Shift Lead, Coordinator, or Admin. Mirrors the server gate on
  // /api/volunteers/manageable; the SWR call below is only made once we know
  // the viewer qualifies (and is on-playa) so a squaddie never fires it.
  const isLeadership =
    checkIsAdmin(accountType, roleList) ||
    checkIsPeersCoordinator(roleList) ||
    checkIsPeersShiftLead(roleList);
  const isEligible = isOnPlaya && isLeadership;

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
  }: {
    data: IManageableVolunteer[] | undefined;
    error: Error | undefined;
  } = useSWR(isEligible ? "/api/volunteers/manageable" : null, fetcherGet);

  // logic
  // ------------------------------------------------------------
  // On-playa only, leadership only. Anyone else (including a squaddie who types
  // the URL directly) gets a plain "not available" message — the endpoints
  // enforce the real boundary regardless.
  if (!isEligible) {
    return (
      <Container
        component="main"
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          mt: 4,
        }}
      >
        <Typography>
          {isLeadership
            ? "Resetting a volunteer's passcode is only available on the playa network."
            : "You don't have permission to view this page."}
        </Typography>
      </Container>
    );
  }

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedVolunteer(null);
    reset(defaultValues);
  };

  // form submission
  // ------------------------------------------------------------
  const onSubmit = (formValues: IFormValues) => {
    if (!formValues.volunteer) return;
    setSelectedVolunteer(formValues.volunteer);
    setIsDialogOpen(true);
  };

  // render
  // ------------------------------------------------------------
  return (
    <Container component="main" sx={{ pt: 3 }}>
      <Card sx={{ margin: "auto", width: theme.spacing(50) }}>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <Typography component="h1" sx={{ mb: 2 }} variant="h6">
              Reset Volly Passcode
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
              Pick a volunteer, then set a new passcode for them. They can
              change it themselves later from their account page.
            </Typography>
            <Stack spacing={2}>
              <Controller
                control={control}
                name="volunteer"
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    fullWidth
                    isOptionEqualToValue={(option, value: IVolunteerOption) =>
                      option.shiftboardId === value.shiftboardId
                    }
                    onChange={(_event, value) => field.onChange(value)}
                    options={data.map(
                      ({ playaName, shiftboardId, worldName }) => ({
                        label: `${playaName} "${worldName}"`,
                        playaName,
                        shiftboardId,
                        worldName,
                      })
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={Boolean(errors.volunteer)}
                        helperText={errors.volunteer?.message}
                        label="Volunteer"
                        required
                        variant="standard"
                      />
                    )}
                  />
                )}
                rules={{ required: "Volunteer is required" }}
              />
            </Stack>
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end", pb: 2, pr: 2, pt: 0 }}>
            <Button
              startIcon={<LockResetIcon />}
              type="submit"
              variant="contained"
            >
              Set new passcode
            </Button>
          </CardActions>
        </form>
      </Card>

      {selectedVolunteer && (
        <PasscodeDialogUpdate
          handleDialogClose={handleDialogClose}
          isDialogOpen={isDialogOpen}
          playaName={selectedVolunteer.playaName}
          shiftboardId={selectedVolunteer.shiftboardId}
          worldName={selectedVolunteer.worldName}
        />
      )}
    </Container>
  );
};
