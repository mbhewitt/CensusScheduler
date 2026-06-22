"use client";

import {
  Login as LoginIcon,
  ManageAccounts as ManageAccountsIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useContext } from "react";

import { Hero } from "@/components/layout/Hero";
import { SessionContext } from "@/state/session/context";
import { checkIsAuthenticated } from "@/utils/checkIsRoleExist";
import { DeveloperModeContext } from "@/state/developer-mode/context";

export const Home = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      settings: { isAuthenticated: isAuthenticatedSession },
      user: { playaName, shiftboardId, worldName },
    },
  } = useContext(SessionContext);

  const isAuthenticated = checkIsAuthenticated(
    accountType,
    isAuthenticatedSession
  );
  const isOAuthConfigured = process.env.NEXT_PUBLIC_OKTA_ENABLED === "true";
  const isPinEnabled = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/camp-at-day.jpg)",
          backgroundSize: "cover",
        }}
        text="Home"
      />
      <Container component="main">
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Welcome!
          </Typography>

          {/*
           * Login affordance sits between the Welcome header and the body
           * copy (per Chipper + Mew, 2026-05-25). Auth state drives the
           * content:
           *   - authenticated → "View your account" link to /info
           *   - unauth + Okta enabled (off-playa) → Okta SSO button
           *   - unauth + PIN enabled (on-playa) → link to /sign-in for
           *     the passcode form (volunteer dropdown stays off Home)
           */}
          <Stack alignItems="center" sx={{ mb: 3 }}>
            {isAuthenticated ? (
              <Button
                component={Link}
                href={`/volunteers/${shiftboardId}/info`}
                size="large"
                startIcon={<ManageAccountsIcon />}
                variant="contained"
              >
                Welcome, {playaName} &quot;{worldName}&quot; — view your account
              </Button>
            ) : isOAuthConfigured ? (
              <Button
                component="a"
                href="/api/auth/okta"
                size="large"
                startIcon={<LoginIcon />}
                variant="contained"
              >
                Sign in to Census
              </Button>
            ) : isPinEnabled ? (
              <Button
                component={Link}
                href="/sign-in"
                size="large"
                startIcon={<LoginIcon />}
                variant="contained"
              >
                Sign in with passcode
              </Button>
            ) : null}
          </Stack>

          <Card>
            <CardContent>
              <Typography>
                Black Rock City (BRC) Census is a collaborative research project
                started in 2002 with the goal of learning more about the
                participants who make up Black Rock City. We conduct a random
                sample of Burners entering the event, then collect online survey
                responses after the Burn. We combine these two data sources to
                get more statistically accurate data about the people who attend
                Burning Man each year.
              </Typography>
              <Typography>
                Data from BRC Census help Burning Man Project represent the
                Burner community in conversations with local, state, and federal
                agencies and elected officials. It is also used to understand
                the impact we have on the environment. In alignment with Burning
                Man Project&apos;s Environmental Sustainability Roadmap, we want
                to reduce our carbon footprint and make the event more
                sustainable. In the last few years, Black Rock City Census has
                offered a way to track the year-to-year impact of concerns
                related to this issue by collecting data about transportation
                and the use of Burner Express bus service.
              </Typography>
              <Typography>
                Just as important is what BRC Census can learn from YOU and the
                gift of your data! This is your chance to have your presence in
                Black Rock City counted and to learn about our community. The
                Census is one of the primary ways Burning Man Project tracks
                changes in population, behavior, and attitudes of event
                participants, giving us all the ability to understand just a bit
                more about the city many of us call home. The more we understand
                the makeup of Black Rock City and the diverse Burning Man
                experiences it offers, the better equipped we are to meet the
                needs of the community and help Burning Man culture continue to
                flourish.
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Learn more
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                To learn more, please visit our portal in the Burning Man
                Journal and the Census Results Archive for reports on past
                years&apos; Census data. The most recent{" "}
                <a
                  href="https://blackrockcitycensus.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Black Rock City Census Population Report
                </a>{" "}
                is available for your perusal at any time.
              </Typography>
              <Typography>
                If you have a question, comment, concern, or if you would like a
                reminder about filling out the Census online survey after the
                event, please fill out the{" "}
                <Link href={{ pathname: "/contact" }}>Contact</Link> form
                located in the tablet menu or email{" "}
                <a href="mailto:censusvolunteercoordinators@burningman.org">
                  censusvolunteercoordinators@burningman.org
                </a>
                . The{" "}
                <a
                  href="https://hive.burningman.org/spaces/14264554/content"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Census Portal on Burning Man Hive
                </a>{" "}
                is a great place to learn about our efforts and conduct any
                training you may require. Finally, you&apos;re more than welcome
                to meet and chat with the team on our{" "}
                <a
                  href="https://discord.gg/jcWuyYDGcn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Census Discord server
                </a>
                !
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
