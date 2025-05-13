import {
  Work as WorkIcon,
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
import IdleTimer from "react-idle-timer";

import {
  pageListAdmin,
  pageListDefault,
  pageListSuperAdmin,
} from "@/components/layout/pageList";
import { IDLE_MINUTES } from "@/constants";
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
  const [isCollapseNavOpen, setIsCollapseNavOpen] = useState(true);

  // other hooks
  // ------------------------------------------------------------
  const pathname = usePathname();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // side effects
  // ------------------------------------------------------------
  const isBehavioralStandardsSigned =
    checkIsBehavioralStandardsSigned(roleList);
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );

  // if volunteer is signed in,
  // did not sign behavioral standards agreement,
  // and is not on behavioral standards agreement page
  // then load behavioral standards agreement page
  useEffect(() => {
    if (
      isAuthenticated &&
      !isBehavioralStandardsSigned &&
      !pathname?.includes("behavioral-standards")
    ) {
      router.push(`/roles/behavioral-standards/${shiftboardId}`);
    }
  }, [
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

  const handleCollapseNavClick = () => {
    setIsCollapseNavOpen((prev) => !prev);
  };
  const handleDrawerOpen = () => {
    setIsDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };
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
              {pageListDefault.map(({ icon, label, path }) => (
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
                      return (
                        <Fragment key={label}>
                          <ListItem disablePadding>
                            <ListItemButton onClick={handleCollapseNavClick}>
                              <ListItemIcon>{icon}</ListItemIcon>
                              <ListItemText primary={label} />
                              {isCollapseNavOpen ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </ListItemButton>
                          </ListItem>
                          <Collapse
                            in={isCollapseNavOpen}
                            timeout="auto"
                            unmountOnExit
                          >
                            <List component="div" disablePadding>
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
                    } else {
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
                    }
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
                  <Link
                    href={`/volunteers/${shiftboardId}/account`}
                    onClick={handleDrawerClose}
                  >
                    <ListItemButton
                      selected={
                        pathname === `/volunteers/${shiftboardId}/account`
                      }
                    >
                      <ListItemIcon>
                        <ManageAccountsIcon />
                      </ListItemIcon>
                      <ListItemText>Account</ListItemText>
                    </ListItemButton>
                  </Link>
                </ListItem>
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

      {/* idle timer */}
      <IdleTimer
        onIdle={handleSignOut}
        timeout={isDisableIdleEnabled ? undefined : IDLE_MINUTES * 60 * 1000}
      />
    </>
  );
};
