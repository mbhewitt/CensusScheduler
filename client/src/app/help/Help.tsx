"use client";

import { Menu as MenuIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";

import { Hero } from "@/components/layout/Hero";

export const Help = () => {
  // other hooks
  // ------------------------------------------------------------
  const theme = useTheme();

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/question-seamless.jpg)",
          backgroundSize: "300px 300px",
        }}
        text="Help"
      />
      <Container component="main">
        <Box component="section">
          <Card>
            <CardContent>
              <Typography>
                Below are instructions on how to sign up for shifts or be checked
                in for your shift on playa.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            All Volunteers
          </Typography>
          <Typography component="h3" variant="h5" sx={{ mb: 2 }}>
            Sign up for a shift
          </Typography>
          <Card>
            <CardContent>
              <Typography>To add yourself to a shift:</Typography>
              <List disablePadding sx={{ listStyle: "decimal", pl: 4 }}>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary='Open the menu by clicking the hamburger icon in the top left-hand corner of the screen and select "Shifts" from the menu options.' />
                  <IconButton
                    disabled
                    sx={{
                      "&:disabled": {
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuIcon
                      sx={{
                        color: theme.palette.common.white,
                      }}
                    />
                  </IconButton>
                  <Typography sx={{ fontWeight: 700, my: 1 }}>OR</Typography>
                  <ListItemText primary='In the Accounts page, scroll to the Shifts section and click "Add shift".' />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Find the Date and Time of the shift you'd like to sign up for and click on the row." />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary='Above the "Volunteers" section, click "Add Volunteer".' />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary='Select your name if not already selected and the shift type in the "Position" field.' />
                  <List disablePadding sx={{ listStyle: "decimal", pl: 4 }}>
                    <ListItem disablePadding sx={{ display: "list-item" }}>
                      <ListItemText primary="If the Position is greyed out, you have not been approved or taken the training to select that shift." />
                    </ListItem>
                  </List>
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary='Click "Add Volunteer" in the pop-up window.' />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary='To confirm, click the hamburger icon and select "Account", scroll down and your selected shifts will be visible.' />
                </ListItem>
              </List>
              <Stack
                alignItems="center"
                sx={{
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    height: theme.spacing(60),
                    mb: 2,
                    position: "relative",
                    width: 1,
                  }}
                >
                  <Image
                    alt="snapshot of the Add Volunteer dialog"
                    fill
                    src="/help/sign-up-1.png"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Shift Leads Only
          </Typography>
          <Typography component="h3" variant="h5" sx={{ mb: 2 }}>
            Check a volunteer in for a shift
          </Typography>
          <Card>
            <CardContent>
              <Typography>To sign in a volunteer:</Typography>
              <List disablePadding sx={{ listStyle: "decimal", pl: 4 }}>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Open the menu by clicking the hamburger icon in the top left-hand corner of the screen." />
                  <IconButton
                    disabled
                    sx={{
                      "&:disabled": {
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <MenuIcon
                      sx={{
                        color: theme.palette.common.white,
                      }}
                    />
                  </IconButton>
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary='Select "Shifts" from the menu options.' />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary='Find the appropriate shift in the list and click on it to access the "Shift Volunteers" page.' />
                  <ListItemText primary="Note: Shifts are sorted by date and time, by default." />
                </ListItem>
                <ListItem disablePadding sx={{ display: "list-item" }}>
                  <ListItemText primary="Find the volunteer's name in the list and click on the toggle-switch to the right to check them in. A green notification will display at the bottom of the screen and the toggle switch will change from light gray to tan, indicating the volunteer is now checked in." />
                  <ListItemText primary="Note: Names are sorted alphabetically, by default. You can also click the magnifying glass icon above the list on the right to type in the volunteer's default or playa name, if preferred instead of scrolling." />
                </ListItem>
              </List>
              <Stack
                alignItems="center"
                sx={{
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    height: theme.spacing(60),
                    mb: 2,
                    position: "relative",
                    width: 1,
                  }}
                >
                  <Image
                    alt="snapshot of shift volunteers page"
                    fill
                    src="/help/check-in-1.png"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography variant="caption">
                  Papa Bear is not yet checked in.
                </Typography>
              </Stack>
              <Stack
                alignItems="center"
                sx={{
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    height: theme.spacing(60),
                    mb: 2,
                    position: "relative",
                    width: 1,
                  }}
                >
                  <Image
                    alt="snapshot of shift volunteers page"
                    fill
                    src="/help/check-in-2.png"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography variant="caption">
                  Papa Bear is now checked in. The gray toggle is now tan and a
                  green notification displays at the bottom of the screen.
                </Typography>
              </Stack>
              <Typography>
                If you accidentally check in the wrong volunteer, you can simply
                click the toggle switch again, changing it back from tan to gray.
                A notification will indicate that the volunteer is no longer
                marked as checked in.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
