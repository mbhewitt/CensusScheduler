import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  ManageAccounts as ManageAccountsIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Toolbar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { Fragment, useContext, useEffect, useState } from "react";
import { useIdleTimer } from "react-idle-timer";

import { InstallAppMenuItem } from "@/components/layout/InstallAppMenuItem";
import {
  pageListAdmin,
  pageListDefault,
  pageListSuperAdmin,
} from "@/components/layout/pageList";
import { IDLE_MINUTES } from "@/constants";
import { useDeviceProvisioned } from "@/hooks/useDeviceProvisioned";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import {
  checkIsAdmin,
  checkIsAuthenticated,
  checkIsBehavioralStandardsSigned,
  checkIsSuperAdmin,
} from "@/utils/checkIsRoleExist";
import { signOut } from "@/utils/signOut";

export const Header = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: {
      accountType,
      disableIdle: { isEnabled: isDisableIdleEnabled },
    },
    developerModeDispatch,
  } = useContext(DeveloperModeContext);
  const {
    sessionDispatch,
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { playaName, roleList, shiftboardId, worldName },
    },
  } = useContext(SessionContext);

  // state
  // ------------------------------------------------------------
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // per-group open state for collapsible nav sections (Shifts, Labels, ...);
  // groups default to open
  const [collapseNavOpen, setCollapseNavOpen] = useState<
    Record<string, boolean>
  >({});

  // other hooks
  // ------------------------------------------------------------
  const pathname = usePathname();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const handleSignOut = () => {
    signOut(
      developerModeDispatch,
      enqueueSnackbar,
      isAuthenticated,
      playaName,
      router,
      sessionDispatch,
      worldName
    );
  };

  // Short idle auto-logout for shared tablets: the timer resets on activity, so
  // "logged out 5 min after activity stops," and a walk-up doesn't leave someone
  // else signed in. Keyed purely on whether this browser is an authed tablet (has
  // the census-device cookie) — per Mew 2026-08-21, same signal as passcode. A
  // provisioned tablet gets the short window; everyone else (Okta volunteers on
  // their own phones) gets ~24h so they aren't kicked out for stepping away. An
  // unprovisioned device can't passcode in anyway, so it never holds a shared
  // session that needs the short timer.
  const isProvisionedTablet = useDeviceProvisioned();
  const idleTimeoutMs = isProvisionedTablet
    ? IDLE_MINUTES * 60 * 1000
    : 24 * 60 * 60 * 1000;
  useIdleTimer({
    onIdle: handleSignOut,
    timeout: isDisableIdleEnabled ? undefined : idleTimeoutMs,
  });

  // side effects
  // ------------------------------------------------------------
  const isBehavioralStandardsSigned =
    checkIsBehavioralStandardsSigned(roleList);

  // On-playa only: force-redirect signed-in volunteers who haven't yet
  // signed the behavioral standards agreement to the BS page before
  // they can use the rest of the app. Off-playa deployments (Okta-only,
  // NEXT_PUBLIC_PIN_ENABLED=false) leave them on whatever page they
  // landed on — the BS page is still accessible via /info if they want
  // to sign it. Per @mbhewitt 2026-05-24: on-playa walk-ups still need
  // the gate; off-playa it's friction we don't want.
  // NEXT_PUBLIC_* inlines at build time so this is a static decision.
  const isOnPlaya = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

  useEffect(() => {
    if (
      isOnPlaya &&
      isAuthenticated &&
      !isBehavioralStandardsSigned &&
      !pathname?.includes("behavioral-standards")
    ) {
      router.push(`/roles/behavioral-standards/${shiftboardId}`);
    }
  }, [
    isOnPlaya,
    isAuthenticated,
    isBehavioralStandardsSigned,
    pathname,
    router,
    shiftboardId,
  ]);

  // logic
  // ------------------------------------------------------------
  const isAdmin = checkIsAdmin(accountType, roleList);
  const isSuperAdmin = checkIsSuperAdmin(accountType, roleList);

  const handleCollapseNavClick = (label: string) => {
    setCollapseNavOpen((prev) => ({
      ...prev,
      [label]: !(prev[label] ?? true),
    }));
  };
  const handleDrawerOpen = () => {
    setIsDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <AppBar position="fixed" sx={{ boxShadow: "none" }}>
        <Toolbar>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{
              width: 1,
            }}
          >
            <IconButton onClick={handleDrawerOpen}>
              <MenuIcon sx={{ color: theme.palette.common.white }} />
            </IconButton>
            <Box
              sx={{
                height: theme.spacing(5),
                mr: theme.spacing(5),
                position: "relative",
                width: 1,
              }}
            >
              <Image
                alt="burning man project logo"
                fill
                priority
                src="/general/logo-header.svg"
              />
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* drawer */}
      <Drawer anchor="left" onClose={handleDrawerClose} open={isDrawerOpen}>
        <Box
          component="nav"
          sx={{
            display: "flex",
            flexDirection: "column",
            height: 1,
            justifyContent: "space-between",
            width: theme.spacing(30),
          }}
        >
          <Box>
            {/* general nav */}
            <List>
              {pageListDefault
                .filter(({ path }) => {
                  // Off-playa /shifts requires auth (middleware redirects
                  // to sign-in). Hide the menu entry for unauthenticated
                  // users so it doesn't appear to "go nowhere". On-playa
                  // walk-up flow keeps it visible — /shifts is in the
                  // on-playa allowlist there.
                  if (path === "/shifts" && !isAuthenticated && !isOnPlaya) {
                    return false;
                  }
                  return true;
                })
                .map(({ icon, label, path }) => (
                <Fragment key={path}>
                  <ListItem disablePadding>
                    <Link href={path} onClick={handleDrawerClose}>
                      <ListItemButton selected={pathname === path}>
                        <ListItemIcon>{icon}</ListItemIcon>
                        <ListItemText primary={label} />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                  {/* Account sits directly under Home — Home is always the top
                      (Chipper). Only shown when signed in (needs shiftboardId). */}
                  {path === "/" && isAuthenticated && (
                    <ListItem disablePadding>
                      <Link
                        href={`/volunteers/${shiftboardId}/info`}
                        onClick={handleDrawerClose}
                      >
                        <ListItemButton
                          selected={
                            pathname === `/volunteers/${shiftboardId}/info`
                          }
                        >
                          <ListItemIcon>
                            <ManageAccountsIcon />
                          </ListItemIcon>
                          <ListItemText primary="Account" />
                        </ListItemButton>
                      </Link>
                    </ListItem>
                  )}
                </Fragment>
              ))}
              {/* Install-as-PWA affordance (hidden once installed). */}
              <InstallAppMenuItem onNavigate={handleDrawerClose} />
            </List>
            {/* admin nav */}
            {isAdmin && (
              <>
                <Divider />
                <List subheader={<ListSubheader>Admin</ListSubheader>}>
                  {pageListAdmin.map(({ icon, label, path }) => (
                    <ListItem disablePadding key={path}>
                      <Link href={path} onClick={handleDrawerClose}>
                        <ListItemButton selected={pathname === path}>
                          <ListItemIcon>{icon}</ListItemIcon>
                          <ListItemText primary={label} />
                        </ListItemButton>
                      </Link>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            {/* super admin nav */}
            {isSuperAdmin && (
              <>
                <Divider />
                <List subheader={<ListSubheader>Super admin</ListSubheader>}>
                  {pageListSuperAdmin.map(({ children, icon, label, path }) => {
                    if (children) {
                      const isGroupOpen = collapseNavOpen[label] ?? true;
                      return (
                        <Fragment key={label}>
                          <ListItem disablePadding>
                            <ListItemButton
                              onClick={() => handleCollapseNavClick(label)}
                            >
                              <ListItemIcon>{icon}</ListItemIcon>
                              <ListItemText primary={label} />
                              {isGroupOpen ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </ListItemButton>
                          </ListItem>
                          <Collapse
                            in={isGroupOpen}
                            timeout="auto"
                            unmountOnExit
                          >
                            <List disablePadding>
                              {children.map(({ icon, label, path }) => (
                                <ListItem disablePadding key={path}>
                                  <Link href={path} onClick={handleDrawerClose}>
                                    <ListItemButton
                                      selected={pathname === path}
                                      sx={{ pl: 4 }}
                                    >
                                      <ListItemIcon>{icon}</ListItemIcon>
                                      <ListItemText primary={label} />
                                    </ListItemButton>
                                  </Link>
                                </ListItem>
                              ))}
                            </List>
                          </Collapse>
                        </Fragment>
                      );
                    }

                    return (
                      <ListItem disablePadding key={label}>
                        <Link href={path} onClick={handleDrawerClose}>
                          <ListItemButton selected={pathname === path}>
                            <ListItemIcon>{icon}</ListItemIcon>
                            <ListItemText primary={label} />
                          </ListItemButton>
                        </Link>
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}
          </Box>
          <Box>
            <Divider />
            {/* authenticated nav */}
            {isAuthenticated ? (
              <List
                subheader={
                  <ListSubheader>
                    {playaName} &quot;{worldName}&quot;
                  </ListSubheader>
                }
              >
                <ListItem disablePadding>
                  <Link href="/sign-in">
                    <ListItemButton
                      onClick={() => {
                        handleSignOut();
                        handleDrawerClose();
                      }}
                    >
                      <ListItemIcon>
                        <LogoutIcon />
                      </ListItemIcon>
                      <ListItemText>Sign out</ListItemText>
                    </ListItemButton>
                  </Link>
                </ListItem>
              </List>
            ) : (
              // unauthenticated nav
              <List>
                <ListItem disablePadding>
                  <Link href="/sign-in" onClick={handleDrawerClose}>
                    <ListItemButton selected={pathname === "/sign-in"}>
                      <ListItemIcon>
                        <LoginIcon />
                      </ListItemIcon>
                      <ListItemText>Sign in</ListItemText>
                    </ListItemButton>
                  </Link>
                </ListItem>
              </List>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};
