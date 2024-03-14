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
import { useContext } from "react";

import { pageListAdmin, pageListDefault } from "src/components/layout/pageList";
import { CORE_CREW_ID } from "src/constants";
import { EasterEggContext } from "src/state/easter-egg/context";
import { SessionContext } from "src/state/session/context";
import { checkRole } from "src/utils/checkRole";

export const Footer = () => {
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { roleList },
    },
  } = useContext(SessionContext);
  const isCoreCrew = checkRole(CORE_CREW_ID, roleList);
  const { setIsEasterEggOpen } = useContext(EasterEggContext);
  const theme = useTheme();

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
        mt: theme.spacing(3),
        pt: theme.spacing(3),
        pb: theme.spacing(2),
      }}
    >
      <Container maxWidth="md">
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mb: theme.spacing(3) }}
        >
          <Stack direction="row" sx={{ gap: theme.spacing(6) }}>
            {/* quick links */}
            <Box>
              <Typography
                component="h3"
                sx={{ color: theme.palette.common.white, mb: theme.spacing(2) }}
                variant="h6"
              >
                Quick links
              </Typography>
              <Stack direction="row" sx={{ gap: theme.spacing(6) }}>
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
            {isAuthenticated && isCoreCrew && (
              <Box>
                <Typography
                  component="h3"
                  sx={{
                    color: theme.palette.common.white,
                    mb: theme.spacing(2),
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
                setIsEasterEggOpen(true);
              }}
              src="/general/logo-census.png"
              width={120}
            />
          </Box>
        </Stack>
      </Container>
      <Container>
        <Divider
          sx={{ borderColor: theme.palette.common.white, mb: theme.spacing(2) }}
        />
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
            2024.E.00015.Prizmo
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};
