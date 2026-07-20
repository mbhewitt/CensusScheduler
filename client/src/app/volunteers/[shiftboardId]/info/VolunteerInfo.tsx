"use client";

import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { PasscodeDialogUpdate } from "@/app/volunteers/[shiftboardId]/account/PasscodeDialogUpdate";
import { PasscodeReveal } from "@/app/volunteers/[shiftboardId]/account/PasscodeReveal";
import { VolunteerShifts } from "@/app/volunteers/[shiftboardId]/account/VolunteerShifts";
import { GetInvolved } from "@/app/volunteers/[shiftboardId]/info/GetInvolved";
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
import { checkIsAdmin, checkIsSuperAdmin } from "@/utils/checkIsRoleExist";
import { fetcherGet, fetcherTrigger } from "@/utils/fetcher";
import { useIsOnPlaya } from "@/utils/useIsOnPlaya";

// human-readable display names for internal role identifiers
// Pretty labels for role identifiers shown in the admin roles list. Only
// active roles need an entry; anything without one falls back to the raw
// role name. The census-era camp/ticket/SAP/training-complete roles were
// deleted 2026-07-17, so their labels were pruned here.
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  BurnerProfileUpdated: "Burner Profile Updated",
};

interface IVolunteerInfoProps {
  shiftboardId: number;
}

export const VolunteerInfo = ({ shiftboardId }: IVolunteerInfoProps) => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: {
        roleList: roleListSession,
        shiftboardId: shiftboardIdSession,
      },
    },
  } = useContext(SessionContext);

  // Self-view = the viewer is the same volunteer whose /info page they
  // opened. Used to gate the passcode-reveal button so admins can't see
  // other volunteers' passcodes (they can still RESET via the Update
  // dialog, just can't read existing values). Per Mew 2026-05-25.
  const isSelfView = shiftboardIdSession === shiftboardId;

  // Off-playa only: the "Get more involved" sidebar links don't work on the
  // offline on-playa tablets, and volunteers aren't signed into those
  // accounts there (#335).
  const isOnPlaya = useIsOnPlaya();

  // refs
  // ------------------------------------------------------------
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
  const { trigger: triggerProfileUpdated } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/info/profile-updated`,
    fetcherTrigger
  );
  const { trigger: triggerEmailPreference } = useSWRMutation(
    `/api/volunteers/${shiftboardId}/info/email-preference`,
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
  const handleEmailUnsubscribedToggle = useCallback(
    async (unsubscribed: boolean) => {
      try {
        await triggerEmailPreference({
          body: { unsubscribed },
          method: "POST",
        });
        mutate();
        enqueueSnackbar(
          <SnackbarText>
            Email preference <strong>updated</strong>
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
    [triggerEmailPreference, mutate, enqueueSnackbar]
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
    behavioralStandardsSigned,
    burnerProfileUpdated,
    emailUnsubscribed,
    volunteer,
  } = data;

  const isAdmin = checkIsAdmin(accountType, roleListSession);
  const isSuperAdmin = checkIsSuperAdmin(accountType, roleListSession);

  // determine which checklist items are complete vs incomplete
  const checklistItems: {
    id: string;
    label: string;
    done: boolean;
    content: React.ReactNode;
  }[] = [];

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
          All volunteers must review and agree to the PEERS Behavioral Standards
          before participating.
        </Typography>
        <Link
          href={`/roles/behavioral-standards/${shiftboardId}`}
          style={{
            color: theme.palette.primary.main,
            fontWeight: 500,
            textDecoration: "underline",
          }}
        >
          Review and sign the Behavioral Standards Agreement
        </Link>
      </Box>
    ),
  });

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
          </a>
          . Once logged in, click <strong>SETTINGS</strong> in the top right,
          then <strong>My Profile</strong> to edit your information. Update any
          fields that have changed since last year, then check the box below to
          confirm.
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

  const incompleteItems = checklistItems.filter((item) => !item.done);
  const completedItems = checklistItems.filter((item) => item.done);

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
          backgroundImage: "url(/banners/city-aerial-day.jpg)",
          backgroundSize: "cover",
        }}
        text="My Account and Shifts"
      />
      <Container maxWidth="lg">
        {/* Header (breadcrumbs + welcome + on-playa/SAP) spans full width.
            The two-column split with the "get more involved" sidebar
            begins lower, at the checklist, so the sidebar aligns with the
            checklist row rather than the page header. */}
        {/* breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <BreadcrumbsNav>
            {/* Volunteers list is admin-only — don't show the link to
                non-admins (they'd hit "no permission"). MUI Breadcrumbs
                drops the falsy child, so no stray separator. */}
            {isAdmin && <Link href="/volunteers">Volunteers</Link>}
            <Typography>{volunteer.playaName}</Typography>
          </BreadcrumbsNav>
        </Box>

        {/* main content \u2014 the welcome header now lives INSIDE the main
            column so its width matches the sections below it, and the PEERS
            logo can sit to its right in the sidebar (per papabear 2026-07-17). */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: isOnPlaya ? 12 : 8 }}>
        {/* welcome header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography component="h2" sx={{ mb: 1 }} variant="h5">
              Welcome, {volunteer.playaName}!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Review your account and complete the checklist items below to
              get ready for the event.
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
        {/* checklist */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography component="h2" sx={{ mb: 1 }} variant="h5">
              PEERS Volunteer Pre-playa Checklist
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

        {/* security — admin/superadmin only. The passcode feature isn't in use
            yet (prod is Okta-only), so hide it from regular volunteers until we
            settle its purpose (per papabear 2026-07-17). */}
        {(isAdmin || isSuperAdmin) && (
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
                  <Typography color="text.secondary" variant="body2">
                    This passcode is for signing in on tablets on-playa
                    only.
                  </Typography>
                </Grid>
                <Grid size={8}>
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    spacing={1}
                  >
                    {/* Reveal is self-only — admins can reset (below) but not
                        see existing values. */}
                    {isSelfView && (
                      <PasscodeReveal shiftboardId={shiftboardId} />
                    )}
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
        )}

        {/* settings — available to all users (email-footer #settings anchor) */}
        <Box component="section" id="settings" sx={{ mt: 3 }}>
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Settings
          </Typography>
          <Card>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!emailUnsubscribed}
                    onChange={(e) =>
                      handleEmailUnsubscribedToggle(!e.target.checked)
                    }
                  />
                }
                label={
                  <Box>
                    <Typography component="span" variant="body1">
                      Receive emails from PEERS
                    </Typography>
                    <Typography
                      color="text.secondary"
                      component="div"
                      variant="body2"
                    >
                      Uncheck to stop receiving automated emails (shift
                      assignments, cancellations, calendar invites). You can
                      re-subscribe here at any time.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", m: 0 }}
              />
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
          </Grid>
          {!isOnPlaya && (
            <Grid size={{ xs: 12, md: 4 }}>
              {/* PEERS logo to the right of the header, above the
                  "get more involved" panel (per papabear 2026-07-17). */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <Image
                  alt="PEERS logo"
                  height={180}
                  src="/general/logo-peers.png"
                  width={160}
                />
              </Box>
              <GetInvolved />
            </Grid>
          )}
        </Grid>
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
