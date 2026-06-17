import {
  Box,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useContext } from "react";

import {
  pageListAdmin,
  pageListDefault,
  pageListSuperAdmin,
} from "@/components/layout/pageList";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import {
  checkIsAdmin,
  checkIsAuthenticated,
  checkIsSuperAdmin,
} from "@/utils/checkIsRoleExist";

export const Footer = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { roleList },
    },
  } = useContext(SessionContext);

  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();
  const theme = useTheme();

  // logic
  // ------------------------------------------------------------
  const isAdmin = checkIsAdmin(accountType, roleList);
  const isSuperAdmin = checkIsSuperAdmin(accountType, roleList);
  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  // NEXT_PUBLIC_* inlines at build time so this is a static decision.
  const isOnPlaya = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

  // render
  // ------------------------------------------------------------
  // Shifts requires login off-playa, so hide it from the footer for
  // logged-out users — mirrors the drawer filter in Header.tsx (#413).
  const pageListDefaultVisible = pageListDefault.filter(({ path }) => {
    if (path === "/shifts" && !isAuthenticated && !isOnPlaya) {
      return false;
    }
    return true;
  });
  const pageListHalfCount = Math.ceil(pageListDefaultVisible.length / 2);
  const pageListHalfFirst = pageListDefaultVisible.slice(0, pageListHalfCount);
  const pageListHalfSecond = pageListDefaultVisible.slice(
    pageListHalfCount,
    pageListDefaultVisible.length
  );

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.primary.main,
        mt: 3,
        pt: 3,
        pb: 2,
      }}
    >
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" sx={{ gap: 6 }}>
            {/* quick links */}
            <Box>
              <Typography
                component="h3"
                sx={{ color: theme.palette.common.white, mb: 2 }}
                variant="h6"
              >
                Quick links
              </Typography>
              <Stack direction="row" sx={{ gap: 6 }}>
                <List sx={{ p: 0 }}>
                  {pageListHalfFirst.map(({ label, path }) => (
                    <ListItem disablePadding key={path}>
                      <Link href={path}>
                        <ListItemText
                          primary={label}
                          primaryTypographyProps={{
                            sx: { color: theme.palette.common.white },
                          }}
                        />
                      </Link>
                    </ListItem>
                  ))}
                </List>
                <List sx={{ p: 0 }}>
                  {pageListHalfSecond.map(({ label, path }) => (
                    <ListItem disablePadding key={path}>
                      <Link href={path}>
                        <ListItemText
                          primary={label}
                          primaryTypographyProps={{
                            sx: { color: theme.palette.common.white },
                          }}
                        />
                      </Link>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            </Box>
            {/* admin */}
            {isAdmin && (
              <Box>
                <Typography
                  component="h3"
                  sx={{
                    color: theme.palette.common.white,
                    mb: 2,
                  }}
                  variant="h6"
                >
                  Admin
                </Typography>
                <List sx={{ p: 0 }}>
                  {pageListAdmin.map(({ label, path }) => (
                    <ListItem disablePadding key={path}>
                      <Link href={path}>
                        <ListItemText
                          primary={label}
                          primaryTypographyProps={{
                            sx: { color: theme.palette.common.white },
                          }}
                        />
                      </Link>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            {/* super admin */}
            {isSuperAdmin && (
              <Box>
                <Typography
                  component="h3"
                  sx={{
                    color: theme.palette.common.white,
                    mb: 2,
                  }}
                  variant="h6"
                >
                  Super admin
                </Typography>
                <List sx={{ p: 0 }}>
                  {pageListSuperAdmin.map(({ children, label, path }) => {
                    if (children) {
                      return (
                        <Fragment key={path}>
                          <ListItem disablePadding>
                            <ListItemText
                              primary={label}
                              primaryTypographyProps={{
                                sx: { color: theme.palette.common.white },
                              }}
                            />
                          </ListItem>
                          <List disablePadding>
                            {children.map(({ label, path }) => (
                              <ListItem disablePadding key={path}>
                                <Link href={path}>
                                  <ListItemText
                                    primary={label}
                                    primaryTypographyProps={{
                                      sx: {
                                        color: theme.palette.common.white,
                                        pl: 2,
                                      },
                                    }}
                                  />
                                </Link>
                              </ListItem>
                            ))}
                          </List>
                        </Fragment>
                      );
                    }

                    return (
                      <ListItem disablePadding key={path}>
                        <Link href={path}>
                          <ListItemText
                            primary={label}
                            primaryTypographyProps={{
                              sx: { color: theme.palette.common.white },
                            }}
                          />
                        </Link>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </Stack>
          <Box
            sx={{
              height: theme.spacing(15),
              position: "relative",
              width: theme.spacing(15),
            }}
          >
            <Image
              alt="census logo"
              height={120}
              onClick={() => {
                router.push("/doodle");
              }}
              src="/general/logo-census.png"
              width={120}
            />
          </Box>
        </Stack>
      </Container>
      <Container>
        <Divider sx={{ borderColor: theme.palette.common.white, mb: 2 }} />
      </Container>
      <Container>
        <Stack direction="row" justifyContent="space-between">
          <Typography
            sx={{
              color: theme.palette.common.white,
            }}
          >
            &copy; {new Date().getFullYear()} BRC Census
          </Typography>
          <Typography
            sx={{
              color: theme.palette.common.white,
            }}
          >
            2026.S.00292.Prizmo
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};
