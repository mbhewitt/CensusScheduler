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
                Sign in to PEERS
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
                <strong>PEERS</strong> — Placement&apos;s Exploration &amp;
                Engagement Research Squad — is a Placement volunteer team that
                celebrates theme camps and gathers neighborhood-level
                observations across Black Rock City. The name is deliberate:
                &quot;peer&quot; means &quot;of equal standing&quot; or &quot;at
                the same level.&quot; Volunteers (known as <em>Squaddies</em>)
                aren&apos;t inspectors — they&apos;re fellow citizens spending a
                few shifts spreading joy and listening to camp leads.
              </Typography>
              <Typography>
                Squaddies visit every theme camp in pairs during 3-hour shifts,
                Monday through Friday, between 8:30am and 10:30pm. Their role is
                first and foremost to{" "}
                <strong>CELEBRATE</strong> the theme camps and their hard work in
                bringing their vision to life! Squaddies ask a few questions
                about their placement experience and neighborhood then{" "}
                <strong>LISTEN</strong> to their responses. Finally, they{" "}
                <strong>OBSERVE</strong> their camp and take a few photos.
              </Typography>
              <Typography>
                The data collected is held with the camp&apos;s record and helps
                the Placers better visualize the neighborhoods they assembled so
                they can continue to improve their craft. Anything urgent gets
                escalated on-playa to Rangers or Placement leadership. Anyone can
                volunteer — new Burners, veterans, camp organizers. We&apos;re
                looking for friendly, respectful, curious people who are willing
                to collaborate, stay objective, and have a good time doing it.
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
                To read more about the PEERS program — what we do, who we are,
                and how to get involved — visit the{" "}
                <a
                  href="https://burningman.org/black-rock-city/camps/placement-process/camp-resource-guide/peers/"
                  target="_blank"
                >
                  PEERS page on burningman.org
                </a>
                . Past PEERS Population Reports are still linked under the{" "}
                <Link href={{ pathname: "/reports" }}>Reports</Link> tab for
                background reading.
              </Typography>
              <Typography>
                Questions, comments, or want to volunteer? Reach the team at{" "}
                <a href="mailto:peers@burningman.org">peers@burningman.org</a>{" "}
                or use the{" "}
                <Link href={{ pathname: "/contact" }}>Contact</Link> form in
                the tablet menu.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
};
