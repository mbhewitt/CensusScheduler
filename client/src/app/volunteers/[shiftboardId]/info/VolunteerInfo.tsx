"use client";

import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  LockReset as LockResetIcon,
  OpenInNew as OpenInNewIcon,
  RateReview as RateReviewIcon,
  VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { PasscodeDialogUpdate } from "@/app/volunteers/[shiftboardId]/account/PasscodeDialogUpdate";
import { VolunteerShifts } from "@/app/volunteers/[shiftboardId]/account/VolunteerShifts";
import { BreadcrumbsNav } from "@/components/general/BreadcrumbsNav";
import { ErrorPage } from "@/components/general/ErrorPage";
import { Loading } from "@/components/general/Loading";
import { SnackbarText } from "@/components/general/SnackbarText";
import { Hero } from "@/components/layout/Hero";
import type { IResVolunteerInfo } from "@/components/types/volunteer-info";
import type { IResRoleRowItem } from "@/components/types/roles";
import type {
  IResVolunteerAccount,
  IResVolunteerRoleItem,
} from "@/components/types/volunteers";
import {
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin } from "@/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";

// valid arrival datenames in display order
const ARRIVAL_DATENAMES = [
  "EarlyThur",
  "EarlyFri",
  "EarlyMan",
  "PreSun",
  "PreMon",
  "PreTue",
  "PreWed",
  "PreThur",
  "PreFri",
  "PreSat",
  "OpenSun",
  "Mon",
  "Tue",
  "Wed",
  "Thur",
  "Fri",
  "BurnSat",
  "TempleSun",
];

// human-readable display names for internal role identifiers
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  CounterCultureCamp: "Camping with Counter Culture",
  CensusLabCamp: "Camping with Census Lab",
  CensusTicket: "Census Ticket",
  BurnerProfileUpdated: "Burner Profile Updated",
  OtherSAP: "Other SAP",
  TrainingCensusBasicsComplete: "Training: Census Basics",
  TrainingRandomSamplingComplete: "Training: Random Sampling",
  TrainingOutReachComplete: "Training: OutReach",
  TrainingDataEntryWizComplete: "Training: Data Entry Wiz",
  TrainingDataBeastDriverComplete: "Training: Data Beast Driver",
};

// format ISO date string to readable format like "Aug 17"
// Use UTC to avoid timezone offset shifting the displayed day
const formatDateDisplay = (isoDate: string): string => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

interface IVolunteerInfoProps {
  shiftboardId: number;
}

// datenames eligible for SAP (pre-opening)
const PRE_OPEN_DATENAMES = [
  "EarlyThur",
  "EarlyFri",
  "EarlyMan",
  "PreSun",
  "PreMon",
  "PreTue",
  "PreWed",
  "PreThur",
  "PreFri",
  "PreSat",
];

export const VolunteerInfo = ({ shiftboardId }: IVolunteerInfoProps) => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { roleList: roleListSession },
    },
  } = useContext(SessionContext);

  // refs
  // ------------------------------------------------------------
  const onPlayaRef = useRef<HTMLDivElement>(null);
  const passcodeRef = useRef<HTMLDivElement>(null);

  // state
  // ------------------------------------------------------------
  const [showCompleted, setShowCompleted] = useState(false);
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);

  // fetching, mutation, and revalidation
  // ------------------------------------------------------------
  const {
    data,
    error,
    mutate,
  }: {
    data: IResVolunteerInfo;
    error: Error | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutate: any;
  } = useSWR(`/api/volunteers/${shiftboardId}/info`, fetcherGet);
  const { trigger: triggerInfo } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/info`,
    fetcherTrigger
  );
  const { trigger: triggerOtherSap } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/info/other-sap`,
    fetcherTrigger
  );
  const { trigger: triggerProfileUpdated } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/info/profile-updated`,
    fetcherTrigger
  );

  // account data (for admin sections: roles, notes, security)
  const {
    data: accountData,
    mutate: mutateAccount,
  }: {
    data: IResVolunteerAccount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutate: any;
  } = useSWR(`/api/volunteers/${shiftboardId}/account`, fetcherGet);
  const { isMutating: isAccountMutating, trigger: triggerAccount } =
    useSWRMutation(
      `/api/volunteers/${shiftboardId}/account`,
      fetcherTrigger
    );

  // all roles (for admin role toggle)
  const {
    data: allRolesData,
  }: {
    data: IResRoleRowItem[];
  } = useSWR(`/api/roles`, fetcherGet);

  // other hooks
  // ------------------------------------------------------------
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { notes: "" },
  });
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    if (accountData) {
      reset({ notes: accountData.notes ?? "" });
    }
  }, [accountData, reset]);

  // handlers
  // ------------------------------------------------------------
  const handleArrivalDateChange = useCallback(
    async (dateId: number | string) => {
      try {
        await triggerInfo({
          body: { arrivalDateId: dateId === "" ? null : Number(dateId) },
          method: "PATCH",
        });
        mutate();
        enqueueSnackbar(
          <SnackbarText>
            Arrival date <strong>updated</strong>
          </SnackbarText>,
          { variant: "success" }
        );
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{error.message}</strong>
            </SnackbarText>,
            { persist: true, variant: "error" }
          );
        }
      }
    },
    [triggerInfo, mutate, enqueueSnackbar]
  );

  const handleOtherSapToggle = useCallback(
    async (hasOtherSap: boolean) => {
      try {
        await triggerOtherSap({
          body: { hasOtherSap },
          method: "POST",
        });
        mutate();
        enqueueSnackbar(
          <SnackbarText>
            Early entry status <strong>updated</strong>
          </SnackbarText>,
          { variant: "success" }
        );
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{error.message}</strong>
            </SnackbarText>,
            { persist: true, variant: "error" }
          );
        }
      }
    },
    [triggerOtherSap, mutate, enqueueSnackbar]
  );

  const handleLocationChange = useCallback(
    async (location: string) => {
      try {
        await triggerInfo({
          body: { location },
          method: "PATCH",
        });
        enqueueSnackbar(
          <SnackbarText>
            Camping location <strong>updated</strong>
          </SnackbarText>,
          { variant: "success" }
        );
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{error.message}</strong>
            </SnackbarText>,
            { persist: true, variant: "error" }
          );
        }
      }
    },
    [triggerInfo, enqueueSnackbar]
  );

  const handleProfileUpdatedToggle = useCallback(
    async (updated: boolean) => {
      try {
        await triggerProfileUpdated({
          body: { updated },
          method: "POST",
        });
        mutate();
        enqueueSnackbar(
          <SnackbarText>
            Burner Profile status <strong>updated</strong>
          </SnackbarText>,
          { variant: "success" }
        );
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{error.message}</strong>
            </SnackbarText>,
            { persist: true, variant: "error" }
          );
        }
      }
    },
    [triggerProfileUpdated, mutate, enqueueSnackbar]
  );

  // role toggle handler
  const handleRoleToggle = useCallback(
    async (roleId: number, roleName: string, hasRole: boolean) => {
      try {
        // NOTE: deliberately NOT setting Content-Type: application/json.
        // The /api/roles/[id]/volunteers handler does JSON.parse(req.body),
        // which only works when Next.js leaves req.body as a raw string. If
        // we set Content-Type: application/json, the pages-router middleware
        // auto-parses the body into an object and JSON.parse(<object>)
        // stringifies it via toString() → "[object Object]" → SyntaxError →
        // 500 → user sees "Failed to add role" snackbar. Every other endpoint
        // is called through fetcherTrigger, which also omits the header for
        // the same reason. (See PR #319.)
        const res = await fetch(`/api/roles/${roleId}/volunteers`, {
          method: hasRole ? "DELETE" : "POST",
          body: JSON.stringify({ shiftboardId }),
        });
        if (!res.ok) {
          throw new Error(`Failed to ${hasRole ? "remove" : "add"} role`);
        }
        mutateAccount();
        mutate();
        enqueueSnackbar(
          <SnackbarText>
            <strong>{roleName}</strong> has been{" "}
            <strong>{hasRole ? "removed" : "added"}</strong>
          </SnackbarText>,
          { variant: "success" }
        );
      } catch (error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>
              {error instanceof Error ? error.message : "An error occurred"}
            </strong>
          </SnackbarText>,
          { persist: true, variant: "error" }
        );
      }
    },
    [shiftboardId, mutate, mutateAccount, enqueueSnackbar]
  );

  // notes form submission
  const onNotesSubmit: SubmitHandler<{ notes: string }> = async (formValues) => {
    try {
      await triggerAccount({
        body: { ...accountData, notes: formValues.notes },
        method: "PATCH",
      });
      enqueueSnackbar(
        <SnackbarText>
          Notes have been <strong>updated</strong>
        </SnackbarText>,
        { variant: "success" }
      );
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          { persist: true, variant: "error" }
        );
      }
    }
  };

  // logic
  // ------------------------------------------------------------
  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  const {
    arrivalDate,
    behavioralStandardsSigned,
    burnerProfileUpdated,
    dates,
    roles,
    roleThresholds,
    sapStatus,
    trainings,
    volunteer,
  } = data;

  const isAdmin = checkIsAdmin(accountType, roleListSession);
  const isPreOpen = arrivalDate
    ? PRE_OPEN_DATENAMES.includes(arrivalDate.datename)
    : false;
  const hasOtherSap = roles.includes("OtherSAP");
  const isStaff = roles.includes("Staff");

  // determine which checklist items are complete vs incomplete
  const checklistItems: {
    id: string;
    label: string;
    done: boolean;
    content: React.ReactNode;
  }[] = [];

  // SAP Issued
  if (sapStatus.sapFile) {
    checklistItems.push({
      id: "sap-issued",
      label: "Your Setup Access Pass (SAP) is ready",
      done: true,
      content: (
        <Box>
          <Typography sx={{ mb: 1 }}>
            Your SAP has been issued and emailed to you. You can also download it
            here:
          </Typography>
          <Button
            href={`/api/volunteers/${shiftboardId}/sap/${sapStatus.sapFile.sapId}`}
            startIcon={<DownloadIcon />}
            variant="contained"
          >
            Download SAP PDF
          </Button>
        </Box>
      ),
    });
  }

  // On-playa plans
  const plansDone =
    arrivalDate !== null && (volunteer.location ?? "").trim().length > 0;
  checklistItems.push({
    id: "plans",
    label: plansDone
      ? "On-playa plans provided"
      : "Tell us your plans for this year\u2019s event",
    done: plansDone,
    content: (
      <Typography>
        Update your arrival date, early entry status, and camping location in the{" "}
        <strong>On-Playa Information and Early Entry / SAP</strong> section above.
      </Typography>
    ),
  });

  // Behavioral Standards
  checklistItems.push({
    id: "behavioral-standards",
    label: behavioralStandardsSigned
      ? "Behavioral Standards Agreement \u2014 Signed"
      : "Review and sign the Behavioral Standards Agreement",
    done: behavioralStandardsSigned,
    content: (
      <Box>
        <Typography sx={{ mb: 1 }}>
          All volunteers must review and agree to the Census Behavioral Standards
          before participating.
        </Typography>
        <Link
          href={`/roles/behavioral-standards/${shiftboardId}`}
          style={{ color: theme.palette.primary.main, fontWeight: 500 }}
        >
          Review and sign the Behavioral Standards Agreement
        </Link>
      </Box>
    ),
  });

  // Training
  if (trainings.length > 0) {
    const allTrainingDone = trainings.every((t) => t.completed);
    checklistItems.push({
      id: "training",
      label: allTrainingDone
        ? "Required training courses completed"
        : "Complete required training courses",
      done: allTrainingDone,
      content: (
        <Box>
          <Typography sx={{ mb: 1 }}>
            Complete each required training course on Census Hive. Click a
            course name below to open it.
          </Typography>
          {trainings.map((t) => (
            <Stack
              alignItems="center"
              direction="row"
              key={t.trainingId}
              spacing={1}
              sx={{ py: 0.5 }}
            >
              {t.completed ? (
                <CheckBoxIcon color="success" fontSize="small" />
              ) : (
                <CheckBoxOutlineBlankIcon
                  sx={{ color: theme.palette.secondary.main }}
                  fontSize="small"
                />
              )}
              {t.completed || !t.url ? (
                <Typography variant="body2">{t.trainingName}</Typography>
              ) : (
                <Typography
                  component="a"
                  href={t.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  variant="body2"
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 500,
                    textDecoration: "underline",
                  }}
                >
                  {t.trainingName}
                </Typography>
              )}
              <Typography
                color="text.secondary"
                variant="body2"
              >
                {t.completed ? "Completed" : "Not yet completed"}
              </Typography>
            </Stack>
          ))}
        </Box>
      ),
    });
  }

  // Burner Profile
  checklistItems.push({
    id: "burner-profile",
    label: burnerProfileUpdated
      ? "Burner Profile \u2014 Updated"
      : "Review and update your Burner Profile",
    done: burnerProfileUpdated,
    content: (
      <Box>
        <Typography sx={{ mb: 1 }}>
          Please visit your{" "}
          <a
            href="https://profiles.burningman.org/my-profile"
            rel="noopener noreferrer"
            target="_blank"
          >
            Burner Profile
          </a>{" "}
          and make sure your information is current. Update any fields that have
          changed since last year, then check the box below to confirm.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={burnerProfileUpdated}
              onChange={(e) => handleProfileUpdatedToggle(e.target.checked)}
            />
          }
          label="I have reviewed and updated my Burner Profile"
        />
      </Box>
    ),
  });

  // SAP Requirements (only for pre-open, non-staff, non-other-SAP)
  if (isPreOpen && !isStaff && !hasOtherSap) {
    const allDaysFulfilled = sapStatus.requiredDays.every((d) => d.fulfilled);
    const sapDone = sapStatus.cspFulfilled && allDaysFulfilled;
    checklistItems.push({
      id: "sap-requirements",
      label: sapDone
        ? "SAP shift requirements met"
        : "Sign up for pre-event shifts to earn a Census SAP for early entry",
      done: sapDone,
      content: (
        <Box>
          <Typography sx={{ mb: 2 }}>
            Earn a Census SAP for early entry to the event. Volunteers must sign
            up for shifts worth at least 12 Census Shift Points (CSP). You will
            also need one Census shift per day beginning the day after your
            planned arrival.
          </Typography>
          <Stack spacing={0.5}>
            <Stack alignItems="center" direction="row" spacing={1}>
              {sapStatus.cspFulfilled ? (
                <CheckBoxIcon color="success" fontSize="small" />
              ) : (
                <CheckBoxOutlineBlankIcon
                  sx={{ color: theme.palette.secondary.main }}
                  fontSize="small"
                />
              )}
              <Typography variant="body2">
                Sign up for at least 12 Census Shift Points
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {sapStatus.totalCsp} / 12 CSP
              </Typography>
            </Stack>
            {sapStatus.requiredDays.map((day) => (
              <Stack
                alignItems="center"
                direction="row"
                key={day.label}
                spacing={1}
              >
                {day.fulfilled ? (
                  <CheckBoxIcon color="success" fontSize="small" />
                ) : (
                  <CheckBoxOutlineBlankIcon
                    sx={{ color: theme.palette.secondary.main }}
                    fontSize="small"
                  />
                )}
                <Typography variant="body2">
                  Shift on {day.label}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {day.fulfilled ? "Fulfilled" : "Still needed"}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ),
    });
  }

  // Staff bypass
  if (isStaff) {
    checklistItems.push({
      id: "staff",
      label: "Staff \u2014 Early entry confirmed",
      done: true,
      content: (
        <Typography>
          As Census staff, your early entry is handled separately. Work your butt
          off and have a great burn!
        </Typography>
      ),
    });
  }

  // Role-based thresholds (Counter Culture, Census Lab, Census Ticket)
  for (const rt of roleThresholds) {
    const pct = Math.min(100, Math.round((rt.currentCsp / rt.requiredCsp) * 100));
    const displayRole = ROLE_DISPLAY_NAMES[rt.role] ?? rt.role;
    checklistItems.push({
      id: `role-${rt.role}`,
      label: rt.fulfilled
        ? `${displayRole} \u2014 Requirements met`
        : `Meet shift requirements for ${displayRole}`,
      done: rt.fulfilled,
      content: (
        <Box>
          <Typography sx={{ mb: 1 }}>
            Sign up for shifts worth at least {rt.requiredCsp} CSP.
          </Typography>
          <Stack alignItems="center" direction="row" spacing={2}>
            <LinearProgress
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              value={pct}
              variant="determinate"
            />
            <Typography variant="body2">
              {rt.fulfilled
                ? "Requirement fulfilled"
                : `${rt.currentCsp} / ${rt.requiredCsp} CSP`}
            </Typography>
          </Stack>
        </Box>
      ),
    });
  }

  const incompleteItems = checklistItems.filter((item) => !item.done);
  const completedItems = checklistItems.filter((item) => item.done);

  // show CSP bar when relevant
  const showCspBar =
    (isPreOpen && !hasOtherSap && !isStaff) || roleThresholds.length > 0;

  // render
  // ------------------------------------------------------------
  return (
    <>
      {/* hero — reuse the account-page banner since the info page is now
          the canonical volunteer page (per @mbhewitt 2026-05-23). The
          previous `banner-volunteers.jpg` reference didn't resolve to a
          file in public/banners. */}
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/man-at-night.jpg)",
          backgroundSize: "cover",
        }}
        text="Volunteer Information"
      />
      <Container maxWidth="md">
        {/* breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <BreadcrumbsNav>
            <Link href="/volunteers">Volunteers</Link>
            <Typography>{volunteer.playaName}</Typography>
          </BreadcrumbsNav>
        </Box>

        {/* welcome header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography component="h2" sx={{ mb: 1 }} variant="h5">
              Welcome, {volunteer.playaName}!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Review your volunteer information and complete the checklist items
              below to get ready for the event.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Playa Name
                </Typography>
                <Typography>{volunteer.playaName || "\u2014"}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  World Name
                </Typography>
                <Typography>{volunteer.worldName || "\u2014"}</Typography>
              </Box>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  Email
                </Typography>
                <Typography>{volunteer.email || "\u2014"}</Typography>
              </Box>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
              Need to update your info?{" "}
              <a
                href="https://profiles.burningman.org/my-profile"
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit your Burner Profile
              </a>
            </Typography>
          </CardContent>
        </Card>

        {/* on-playa information and early entry / SAP */}
        <Card ref={onPlayaRef} sx={{ mb: 3 }}>
          <CardContent>
            <Typography component="h2" sx={{ mb: 1 }} variant="h5">
              On-Playa Information and Early Entry / SAP
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
              As a Census volunteer, you may be eligible for early entry to the
              event. Select your earliest available arrival date below, and
              we&apos;ll show you what&apos;s needed to qualify for a Setup Access
              Pass (SAP).
            </Typography>

            {/* arrival date */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ mb: 0.5 }} variant="subtitle2">
                Desired / Expected Arrival Date
              </Typography>
              <Select
                aria-label="Desired / Expected Arrival Date"
                displayEmpty
                onChange={(e) =>
                  handleArrivalDateChange(e.target.value)
                }
                size="small"
                sx={{ minWidth: 300 }}
                value={arrivalDate?.dateId ?? ""}
              >
                <MenuItem value="">
                  <em>&mdash; Select &mdash;</em>
                </MenuItem>
                {dates
                  .filter((d) => ARRIVAL_DATENAMES.includes(d.datename))
                  .map((d) => (
                    <MenuItem key={d.dateId} value={d.dateId}>
                      {d.datename} &mdash; {formatDateDisplay(d.date)}
                    </MenuItem>
                  ))}
              </Select>
            </Box>

            {/* early entry question (only for pre-open dates) */}
            {isPreOpen && (
              <Box
                sx={{
                  backgroundColor: theme.palette.action.hover,
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  borderRadius: 1,
                  mb: 2,
                  p: 2,
                }}
              >
                <Typography sx={{ mb: 1 }} variant="subtitle2">
                  Early Entry
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                  The arrival date you selected is prior to the gate opening at the
                  event. Do you already have a pass for early entry through a
                  different department, or would you like Census to provide this?
                </Typography>
                <Select
                  aria-label="Early entry source"
                  onChange={(e) =>
                    handleOtherSapToggle(e.target.value === "other")
                  }
                  size="small"
                  sx={{ minWidth: 300 }}
                  value={hasOtherSap ? "other" : "census"}
                >
                  <MenuItem value="census">
                    I would like Census to provide early entry
                  </MenuItem>
                  <MenuItem value="other">
                    I already have early entry through another department
                  </MenuItem>
                </Select>
              </Box>
            )}

            {/* camping location */}
            <Box>
              <Typography sx={{ mb: 0.5 }} variant="subtitle2">
                Tell us about where you will be camping
              </Typography>
              <TextField
                defaultValue={volunteer.location}
                fullWidth
                multiline
                onBlur={(e) => handleLocationChange(e.target.value)}
                placeholder="e.g., Counter Culture Camp at 7:30 & G"
                rows={2}
                size="small"
              />
              <Typography color="text.secondary" variant="caption">
                How to find you on playa and any other relevant info
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* checklist */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography component="h2" sx={{ mb: 1 }} variant="h5">
              Census Volunteer Pre-playa Checklist
            </Typography>

            {/* color/status legend */}
            <Stack
              direction="row"
              spacing={3}
              sx={{
                mb: 2,
                py: 1,
                px: 2,
                bgcolor: "rgba(0,0,0,0.02)",
                borderRadius: 1,
                fontSize: "0.875rem",
                color: "text.secondary",
              }}
            >
              <Stack alignItems="center" direction="row" spacing={0.5}>
                <CheckBoxOutlineBlankIcon
                  sx={{ color: theme.palette.secondary.main }}
                  fontSize="small"
                />
                <Typography variant="caption">Action needed</Typography>
              </Stack>
              <Stack alignItems="center" direction="row" spacing={0.5}>
                <CheckBoxIcon color="success" fontSize="small" />
                <Typography variant="caption">Completed</Typography>
              </Stack>
            </Stack>

            {/* CSP bar */}
            {showCspBar && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Your current total:{" "}
                <strong>{sapStatus.totalCsp}</strong> Census Shift Points (CSP)
                scheduled
              </Alert>
            )}

            {/* incomplete items */}
            {incompleteItems.length === 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                All items complete!
              </Alert>
            ) : (
              incompleteItems.map((item) => (
                <Accordion
                  key={item.id}
                  defaultExpanded
                  sx={{
                    "&:before": { display: "none" },
                    boxShadow: "none",
                    border: `1px solid ${theme.palette.divider}`,
                    mb: 1,
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <CheckBoxOutlineBlankIcon
                        sx={{ color: theme.palette.secondary.main }}
                        fontSize="small"
                      />
                      <Typography>{item.label}</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>{item.content}</AccordionDetails>
                </Accordion>
              ))
            )}

            {/* completed items toggle */}
            {completedItems.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Accordion
                  onChange={() => setShowCompleted(!showCompleted)}
                  expanded={showCompleted}
                  sx={{
                    "&:before": { display: "none" },
                    boxShadow: "none",
                    border: `1px solid ${theme.palette.divider}`,
                    mb: 1,
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <CheckBoxIcon color="success" fontSize="small" />
                      <Typography>
                        View {completedItems.length} completed item
                        {completedItems.length > 1 ? "s" : ""}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    {completedItems.map((item) => (
                      <Accordion
                        key={item.id}
                        sx={{
                          "&:before": { display: "none" },
                          boxShadow: "none",
                          borderTop: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Stack
                            alignItems="center"
                            direction="row"
                            spacing={1}
                          >
                            <CheckBoxIcon color="success" fontSize="small" />
                            <Typography>{item.label}</Typography>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>{item.content}</AccordionDetails>
                      </Accordion>
                    ))}
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* shifts — reuse existing VolunteerShifts component */}
        <Box component="section" ref={passcodeRef}>
          <VolunteerShifts shiftboardId={shiftboardId} />
        </Box>

        {/* security — available to all users */}
        <Box component="section" sx={{ mt: 3 }}>
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Security
          </Typography>
          <Card>
            <CardContent>
              <Grid container alignItems="center">
                <Grid size={4}>
                  <Typography component="h3" variant="h6">
                    Passcode
                  </Typography>
                </Grid>
                <Grid size={8}>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      onClick={() => setIsPasscodeDialogOpen(true)}
                      startIcon={<LockResetIcon />}
                      type="button"
                      variant="contained"
                    >
                      Update passcode
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* admin sections */}
        {isAdmin && accountData && (
          <Box component="section" sx={{ mt: 3 }}>
            <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
              Admin
            </Typography>

            {/* roles */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                  Roles
                </Typography>
                {(() => {
                  const activeRoleIds = new Set(
                    accountData.roleList.map(
                      (r: IResVolunteerRoleItem) => r.id
                    )
                  );
                  const protectedRoleIds = new Set([
                    ROLE_ADMIN_ID,
                    ROLE_SUPER_ADMIN_ID,
                  ]);
                  const displayRoles = (allRolesData ?? []).filter(
                    (r: IResRoleRowItem) => r.display
                  );
                  const activeRoles = displayRoles.filter(
                    (r: IResRoleRowItem) => activeRoleIds.has(r.id)
                  );
                  const inactiveRoles = displayRoles.filter(
                    (r: IResRoleRowItem) => !activeRoleIds.has(r.id)
                  );

                  return (
                    <>
                      {/* active roles */}
                      <List disablePadding>
                        {activeRoles.map((r: IResRoleRowItem) => {
                          const isProtected = protectedRoleIds.has(r.id);
                          return (
                            <ListItem
                              disablePadding
                              key={r.id}
                              sx={{
                                cursor: isProtected
                                  ? "default"
                                  : "pointer",
                                py: 0.5,
                                "&:hover": isProtected
                                  ? {}
                                  : {
                                      backgroundColor:
                                        theme.palette.action.hover,
                                    },
                              }}
                              onClick={() => {
                                if (!isProtected) {
                                  handleRoleToggle(r.id, r.name, true);
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <VerifiedUserIcon color="secondary" />
                              </ListItemIcon>
                              <ListItemText>
                                {ROLE_DISPLAY_NAMES[r.name] ?? r.name}
                              </ListItemText>
                              {isProtected && (
                                <Typography
                                  color="text.secondary"
                                  variant="caption"
                                >
                                  protected
                                </Typography>
                              )}
                            </ListItem>
                          );
                        })}
                      </List>

                      {/* inactive roles */}
                      {inactiveRoles.length > 0 && (
                        <List disablePadding sx={{ mt: 1 }}>
                          {inactiveRoles.map((r: IResRoleRowItem) => (
                            <ListItem
                              disablePadding
                              key={r.id}
                              sx={{
                                cursor: "pointer",
                                py: 0.5,
                                opacity: 0.5,
                                "&:hover": {
                                  backgroundColor:
                                    theme.palette.action.hover,
                                  opacity: 1,
                                },
                              }}
                              onClick={() =>
                                handleRoleToggle(r.id, r.name, false)
                              }
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <VerifiedUserIcon color="disabled" />
                              </ListItemIcon>
                              <ListItemText>
                                <Typography color="text.secondary">
                                  {ROLE_DISPLAY_NAMES[r.name] ?? r.name}
                                </Typography>
                              </ListItemText>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* notes */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Grid container>
                  <Grid size={4}>
                    <Typography component="h3" variant="h6">
                      Notes
                    </Typography>
                  </Grid>
                  <Grid size={8}>
                    <form
                      autoComplete="off"
                      onSubmit={handleSubmit(onNotesSubmit)}
                    >
                      <Controller
                        control={control}
                        name="notes"
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            variant="standard"
                          />
                        )}
                      />
                      <Stack direction="row" justifyContent="flex-end">
                        <Button
                          disabled={isAccountMutating}
                          startIcon={
                            isAccountMutating ? (
                              <CircularProgress size="1rem" />
                            ) : (
                              <RateReviewIcon />
                            )
                          }
                          sx={{ mt: 2 }}
                          type="submit"
                          variant="contained"
                        >
                          Update notes
                        </Button>
                      </Stack>
                    </form>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>

      {/* passcode update dialog */}
      <PasscodeDialogUpdate
        handleDialogClose={() => setIsPasscodeDialogOpen(false)}
        isDialogOpen={isPasscodeDialogOpen}
        playaName={volunteer.playaName}
        shiftboardId={shiftboardId}
        worldName={volunteer.worldName}
      />
    </>
  );
};
