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

import { Hero } from "src/components/layout/Hero";

export const Help = () => {
  // other hooks
  // --------------------
  const theme = useTheme();

  // display
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="census volunteers riding the census art car"
            fill
            priority
            src="/help/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Help"
      />
      <Container component="main">
        <Box component="section">
          <Card>
            <CardContent>
              <Typography>
                Below are instructions on how to perform three of the most
                common operations available on the tablet.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Sign a volunteer in for a shift
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
                  <ListItemText primary="Find the volunteer's name in the list and click on the toggle-switch to the right to check them in. A green notification will display at the bottom of the screen and the toggle switch will change from light gray to pink, indicating the volunteer is now checked in." />
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
                    src="/help/check-in-1.jpg"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography variant="caption">
                  Cali Green is not yet checked in.
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
                    src="/help/check-in-2.jpg"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography variant="caption">
                  Cali Green is now checked in. The gray toggle is now pink and
                  a green notification displays at the bottom of the screen.
                </Typography>
              </Stack>
              <Typography>
                If you accidentally check in the wrong volunteer, you can simply
                click the toggle switch again, changing it back from pink to
                gray. A notification will indicate that the volunteer is no
                longer marked as checked in.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Create an account for a new volunteer
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                There will be extra name badges for new volunteers. These will
                be kept with the other volunteer badges in the Data Entry Office
                (If you cannot find the badges, locate a shift lead/member of
                Census leadership - please see the Who&apos;s Who in the lounge
                if you don&apos;t know who to look for).
              </Typography>
              <Typography>
                New volunteer name badges are automatically assigned a passcode,
                which will be located on the badge itself. This will become the
                new volunteer&apos;s ongoing passcode, so it is important they
                do not lose their badge.
              </Typography>
              <Typography>
                The provided name on the new volunteer name badge will be used
                to initially sign-up the volunteer. In this example, the name
                provided was &quot;Red Quad.&quot; In order to add this account,
                press the hamburger pop-out menu in the top left-hand corner of
                the screen (looks like three horizontal lines), select
                &quot;Sign In&quot; and locate the name on the badge in the
                drop-down &quot;Name&quot; menu (as seen below). Use the
                passcode on the name badge to sign the volunteer in.
              </Typography>
              <Stack
                alignItems="center"
                sx={{
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    height: theme.spacing(30),
                    mb: 2,
                    position: "relative",
                    width: 1,
                  }}
                >
                  <Image
                    alt="snapshot of sign in page"
                    fill
                    src="/help/create-account-1.jpg"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </Stack>
              <Typography>
                After entering the passcode, you should see the screen below.
              </Typography>
              <Stack
                alignItems="center"
                sx={{
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    height: theme.spacing(30),
                    position: "relative",
                    width: 1,
                  }}
                >
                  <Image
                    alt="snapshot of volunteer account page"
                    fill
                    src="/help/create-account-2.jpg"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </Stack>
              <Typography>
                Either the lab host or volunteer can fill out the requested
                information, followed by pressing the &quot;update&quot; button.
                After this process is complete, the volunteer will be located in
                our system, and can be added to the shift of their choice
                (pending open availability).
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>
            Send a message
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                If a BRC participant would like an email reminder to fill out
                their Census form, asks a question you do not know the answer
                to, would like to provide anonymous feedback, or would like to
                contact a specific volunteer coordinator or Census lead, you can
                select the hamburger pop-out menu in the top left-hand corner of
                the screen (looks like three horizontal lines) and select
                &quot;Contact.&quot; From there, the participant can select the
                option that fits their needs. &quot;Send me a reminder&quot;
                will be the first available option at the top of the drop-down
                menu, in addition to the specific names of possible individuals
                they might be trying to contact (see example below).
              </Typography>
              <Box
                sx={{
                  height: theme.spacing(30),
                  position: "relative",
                  width: 1,
                }}
              >
                <Image
                  alt="snapshot of contact page"
                  fill
                  src="/help/send-message-1.jpg"
                  style={{
                    objectFit: "contain",
                  }}
                />
              </Box>
              <Stack direction="row" gap={theme.spacing(2)}>
                <Box sx={{ flex: 1 }}>
                  <Typography paragraph>
                    Ask the participant to{" "}
                    <Typography
                      component="span"
                      sx={{ textDecoration: "underline" }}
                    >
                      double check their email address
                    </Typography>
                    , as every year many email addresses are entered
                    incorrectly. Unanswered questions will be addressed
                    post-event via an email reply.{" "}
                    <strong>
                      Make sure to use the checkbox feature to select
                      &quot;reply wanted after Burning Man&quot; as seen above!
                    </strong>
                  </Typography>
                  <Typography paragraph>
                    If for some reason the interface isn&apos;t working, there
                    will be an “Unanswered Questions” book at the Census Lab for
                    participants to write down their contact information and
                    question. In this case, please ask them to write clearly!
                  </Typography>
                  <Typography>
                    If you still have questions about using the tablet, please
                    consult the Census Lab Tablet Guide. Access a digital copy
                    of the tablet guide in the file folder on this tablet. A
                    printed copy is also available in the Census Lab binder,
                    which is located in the Data Entry Office. You can also ask
                    a shift lead or volunteer coordinator to help or look for
                    one of the volunteers shown on the &quot;Who&apos;s Who
                    board&quot;, which can be found in the Census Lounge area.
                  </Typography>
                </Box>
                <Stack
                  alignItems="center"
                  sx={{
                    flex: 1,
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
                      alt="snapshot of to drop-down options in contact page"
                      fill
                      src="/help/send-message-2.jpg"
                      style={{
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                  <Typography variant="caption">
                    Drop-down menu when searching for a specific role lead or
                    core volunteer.
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
