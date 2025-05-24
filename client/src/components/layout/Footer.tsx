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
import { useContext } from "react";

import {
  pageListAdmin,
  pageListDefault,
  pageListSuperAdmin,
} from "@/components/layout/pageList";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin, checkIsSuperAdmin } from "@/utils/checkIsRoleExist";

export const Footer = () => {
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

  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();
  const theme = useTheme();

  // logic
  // ------------------------------------------------------------
  const isAdmin = checkIsAdmin(accountType, roleList);
  const isSuperAdmin = checkIsSuperAdmin(accountType, roleList);

  // render
  // ------------------------------------------------------------
  const pageListHalfCount = Math.ceil(pageListDefault.length / 2);
  const pageListHalfFirst = pageListDefault.slice(0, pageListHalfCount);
  const pageListHalfSecond = pageListDefault.slice(
    pageListHalfCount,
    pageListDefault.length
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
                  <ListItem disablePadding>
                    <ListItemText
                      primary="Shifts"
                      primaryTypographyProps={{
                        sx: { color: theme.palette.common.white },
                      }}
                    />
                  </ListItem>
                  <List component="div" disablePadding>
                    {pageListSuperAdmin.map(({ label, path }) => (
                      <ListItem disablePadding key={path}>
                        <Link href={path}>
                          <ListItemText
                            primary={label}
                            primaryTypographyProps={{
                              sx: { color: theme.palette.common.white, pl: 2 },
                            }}
                          />
                        </Link>
                      </ListItem>
                    ))}
                  </List>
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
            2025.S.00191.Prizmo
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};
