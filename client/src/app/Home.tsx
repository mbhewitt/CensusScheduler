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
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

import { OfflineLink } from "@/components/general/OfflineLink";
import { Hero } from "@/components/layout/Hero";
import { useDeviceProvisioned } from "@/hooks/useDeviceProvisioned";
import { SessionContext } from "@/state/session/context";
import { checkIsAuthenticated } from "@/utils/checkIsRoleExist";
import { isPwaStandalone } from "@/utils/isPwa";
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
  // Installed-PWA sign-ins get a long-lived session (see /api/auth/okta).
  // Detected after mount, so SSR renders the plain href.
  const [isPwa, setIsPwa] = useState(false);
  useEffect(() => setIsPwa(isPwaStandalone()), []);
  const oktaHref = isPwa ? "/api/auth/okta?pwa=1" : "/api/auth/okta";
  // On a provisioned tablet the sign-in CTA must route to /sign-in (passcode),
  // not straight to Okta — the tablet is passcode-only (matches SignIn, per
  // Mew 2026-08-26). `undefined` while the device check is in flight, so we
  // show a disabled placeholder for that brief window (no Okta flash).
  const isProvisionedTablet = useDeviceProvisioned();
  // PIN sign-in is the on-playa signal (same convention as
  // ShareButton/VolunteerInfo). On-playa the recruitment-oriented "How to
  // Volunteer" / "Volunteer Roles" copy doesn't apply (volunteers are already
  // here and sign in with a passcode), so that block stays gated off-playa.
  // The Hive "Learn More" section, however, now shows on-playa too: its links
  // are wired through OfflineLink so volunteers can email themselves the Hive
  // link to follow up from home (#643, folds in #630).
  const isOnPlaya = isPinEnabled;

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
            2026 Black Rock City Census volunteer shifts are now open!
          </Typography>

          {isAuthenticated ? (
            <Typography sx={{ mb: 2 }}>
              You&apos;re signed in. View your account below, or head to the{" "}
              <Link href="/shifts">Shifts</Link> page to see requirements and sign
              up.
            </Typography>
          ) : isOnPlaya ? (
            <Typography sx={{ mb: 2 }}>
              Welcome to the Census Lab! Sign in below with your passcode to view
              your shifts and schedule.
            </Typography>
          ) : (
            <Typography sx={{ mb: 2 }}>
              Sign in below with your Burner Profile to view shift requirements and
              sign up. Don&apos;t have a Burner Profile yet? Create one at{" "}
              <a
                href="https://profiles.burningman.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                profiles.burningman.org
              </a>
              .
            </Typography>
          )}

          {/*
           * Login affordance sits between the header and the body copy
           * (per Chipper + Mew, 2026-05-25). Auth state drives the content:
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
            ) : isProvisionedTablet === undefined ? (
              <Button
                disabled
                size="large"
                startIcon={<CircularProgress size="1rem" />}
                variant="contained"
              >
                Sign in to Census
              </Button>
            ) : isProvisionedTablet ? (
              <Button
                component={Link}
                href="/sign-in"
                size="large"
                startIcon={<LoginIcon />}
                variant="contained"
              >
                Sign in to Census
              </Button>
            ) : isOAuthConfigured ? (
              <Button
                component="a"
                href={oktaHref}
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
              <Typography component="h3" variant="h5" sx={{ mb: 1 }}>
                Overview
              </Typography>
              <Typography>
                BRC Census is a collaborative research project that started in
                2002 with the goal of learning more about the participants who
                make up Black Rock City. We conduct a random sample of Burners
                entering the event, then collect online survey responses after
                the Burn. We combine these two data sources to get more
                statistically accurate data about the people who attended Burning
                Man that year.
              </Typography>
              {/* External data site — dead offline (#629). */}
              {!isOnPlaya && (
                <Typography>
                  Check out the{" "}
                  <a
                    href="https://blackrockcitycensus.org/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Black Rock City Census Population Analysis
                  </a>{" "}
                  to explore our data.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Learn More (Hive) — shown on-playa too. Its links are dead offline,
            so OfflineLink turns them into "email this to me" actions (#643,
            #630). Off-playa they render as normal external links. */}
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Learn More about BRC Census
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                The{" "}
                <OfflineLink
                  href="https://hive.burningman.org/spaces/14264554/content"
                  label="Black Rock City Census Community on Hive"
                />{" "}
                is the best place to get all the information you need about who
                we are and what we do. You will also get the most up-to-date
                information about volunteering. On Hive, you can learn about how
                we gather and use data, see the various roles available for
                volunteers, meet the leadership team, get a calendar of our
                upcoming events, and complete the training you need to volunteer
                (this varies by role). If you do not yet have a Burner Profile,
                create one at{" "}
                <OfflineLink
                  href="https://profiles.burningman.org"
                  label="profiles.burningman.org"
                />
                . Once that&apos;s done, return here and{" "}
                <OfflineLink
                  href="https://hive.burningman.org/spaces/14264554/"
                  label="log in and view our Census community on Hive"
                >
                  click this link
                </OfflineLink>{" "}
                to log in and view our Census community on Hive.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Recruitment-oriented sections: aimed at prospective volunteers
            rather than people already on playa. Hidden on-playa (#629);
            unchanged off-playa. Discord + Hive links are wired through
            OfflineLink so behavior is identical off-playa. */}
        {!isOnPlaya && (
          <>
        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            How to Volunteer
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                We&apos;re glad you&apos;re interested in the Black Rock City
                Census! Each year the Census gathers data that serves a vital
                purpose for Burning Man, in addition to just being interesting to
                know. It&apos;s an all-volunteer effort, and we would love to
                welcome you to our happy crew!
              </Typography>
              <Typography>
                {isAuthenticated ? (
                  <>
                    You&apos;re all set — use the{" "}
                    <Link href="/shifts">Shifts</Link> page above to view shift
                    requirements and sign up.
                  </>
                ) : (
                  <>
                    Are you ready to become a Census volunteer?{" "}
                    <a href={isOAuthConfigured ? oktaHref : "/sign-in"}>
                      Sign in
                    </a>{" "}
                    above with your Burner Profile to view shift requirements and
                    sign up.
                  </>
                )}{" "}
                If you still have questions after reviewing our information, or if
                you would like to share your ideas about how to make an impact
                some other way, contact{" "}
                <a href="mailto:censusvolunteercoordinators@burningman.org">
                  censusvolunteercoordinators@burningman.org
                </a>{" "}
                and let us know how you want to participate! You&apos;re also more
                than welcome to meet and chat with the team on our{" "}
                <OfflineLink
                  href="https://discord.gg/jcWuyYDGcn"
                  label="Census Discord server"
                />
                .
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box component="section">
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Volunteer Roles
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                Brief descriptions of the various volunteer roles are below.
                More information about roles and the training necessary for each
                can be found in our Census Community on Hive, linked above.
              </Typography>
              <Typography>
                <strong>Random Samplers</strong> are stationed on Gate Road or
                BRC Airport as Burners arrive on playa. They collect basic
                demographic information from randomly selected participants. Good
                mobility, punctuality, enthusiasm, and communication skills are
                essential!
              </Typography>
              <Typography>
                <strong>Traffic Tamers</strong> team up with Random Samplers on
                Gate Road to work the lanes of traffic ahead of the sampling
                point, getting participants excited about filling out the brief
                sampling form. Mobility, punctuality, and enthusiasm are all
                important traits!
              </Typography>
              <Typography>
                <strong>Census Lab Hosts</strong> welcome visitors to the Census
                Lab. They answer participants&apos; questions about the Census
                and invite them to participate in a variety of ways.
              </Typography>
              <Typography>
                <strong>Pop-up Lab Hosts</strong> travel on our Census transport
                vehicle, the Data Beast, to a random location on playa to
                educate participants about Census and invite them to write in the
                Field Notes Journals.
              </Typography>
              <Typography>
                <strong>Data Entry</strong> volunteers assist on playa, entering
                the data collected during random sampling shifts. This role calls
                for quick and accurate typists with good attention to detail!
              </Typography>
              <Typography>
                <strong>Data Disseminators</strong> assist with on-playa
                outreach, distributing our Friday preliminary report out to major
                areas within BRC and encouraging participants to fill out the
                online survey at the end of the event. These volunteers must be
                friendly, mobile and clear communicators.
              </Typography>
              <Typography>
                A core team of dedicated Census volunteers work year-round to
                help with data analysis and visualization, blog post writing and
                editing, pre-Burn planning, and other tasks.
              </Typography>
              <Typography>
                If any of these sound like good fits for you or if you would like
                to make an impact some other way, contact{" "}
                <a href="mailto:censusvolunteercoordinators@burningman.org">
                  censusvolunteercoordinators@burningman.org
                </a>{" "}
                and let us know how you want to participate! We suggest reading
                through the{" "}
                <OfflineLink
                  href="https://hive.burningman.org/spaces/14264554/content"
                  label="Black Rock City Census Community on Hive"
                />{" "}
                first.
              </Typography>
            </CardContent>
          </Card>
        </Box>
          </>
        )}
      </Container>
    </>
  );
};
