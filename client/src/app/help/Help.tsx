"use client";

import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Hero } from "@/components/layout/Hero";

// App URL — shown as shareable text and used for the "this is where you
// volunteer" link.
const APP_URL = "https://volunteers.census.burningman.org";

// Links out to another page open in a new tab so readers keep their place in
// the Help.
const PageLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

// Bulleted list that renders naturally inside an accordion.
const Bullets = ({ items }: { items: ReactNode[] }) => (
  <List disablePadding sx={{ listStyle: "disc", pl: 4 }}>
    {items.map((item, index) => (
      <ListItem key={index} disablePadding sx={{ display: "list-item" }}>
        <ListItemText primary={item} />
      </ListItem>
    ))}
  </List>
);

// Numbered steps — used for the multi-step flows (signing in, trainings).
const Steps = ({ items }: { items: ReactNode[] }) => (
  <List component="ol" disablePadding sx={{ listStyle: "decimal", pl: 4 }}>
    {items.map((item, index) => (
      <ListItem key={index} disablePadding sx={{ display: "list-item" }}>
        <ListItemText primary={item} />
      </ListItem>
    ))}
  </List>
);

const Section = ({
  id,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => (
  <Accordion
    id={id}
    disableGutters
    expanded={expanded}
    onChange={onToggle}
    sx={{ scrollMarginTop: 80 }}
  >
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

export const Help = () => {
  // Which sections are open (accordions are independently expandable).
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  // Open a section and scroll to it. rAF lets the accordion expand before we
  // scroll, so sections low on the page don't land short.
  const openSection = useCallback((id: string) => {
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    );
  }, []);

  // Open + scroll when the URL hash points at a section — on load (arriving
  // from another page's link) and on back/forward navigation.
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (id) openSection(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [openSection]);

  // In-page jump. Drives open+scroll directly (not via hashchange) so it still
  // works when the hash already matches the target — e.g. a #vip link clicked
  // while the URL is already #vip but the VIP accordion was collapsed.
  const Jump = ({ to, children }: { to: string; children: ReactNode }) => (
    <a
      href={`#${to}`}
      onClick={(e) => {
        e.preventDefault();
        window.history.replaceState(null, "", `#${to}`);
        openSection(to);
      }}
    >
      {children}
    </a>
  );

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
        <Box component="section" sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 1 }}>
                Welcome! This page walks you through using the Census volunteer
                app — signing in, signing up for shifts, your checklist,
                trainings, and more. Tap any section below to open it.
              </Typography>
              <Typography>
                Some steps depend on where you are: <strong>🏜️ on playa</strong>{" "}
                (at the Census Lab) vs <strong>🏠 from home</strong> (your own
                device). Watch for those icons. On the tablets at the Census
                Lab? Jump to{" "}
                <Jump to="on-playa">At the Census Lab (on playa)</Jump>.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Section
            id="getting-started"
            title="Getting started — signing in"
            expanded={open.has("getting-started")}
            onToggle={() => toggle("getting-started")}
          >
            <Typography sx={{ mb: 1 }}>
              The Census app lives at{" "}
              <PageLink href={APP_URL}>volunteers.census.burningman.org</PageLink>
              . That&apos;s the place to volunteer with Census — easy to
              remember, and easy to share with a friend who wants to join.
            </Typography>

            <Typography sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
              🏠 From home, on your own device
            </Typography>
            <Steps
              items={[
                <>
                  Go to{" "}
                  <PageLink href={APP_URL}>
                    volunteers.census.burningman.org
                  </PageLink>
                  .
                </>,
                <>
                  Tap the big pink <strong>Sign in to Census</strong> button at
                  the top of the page.
                </>,
                <>
                  You&apos;ll be sent to the <strong>Burning Man login</strong>{" "}
                  (the same one Hive uses) to sign in with your Burner Profile.
                </>,
                <>
                  Once you sign in, you&apos;re brought right back to the Census
                  app automatically. <strong>This redirect is normal</strong> —
                  you&apos;re not being logged out.
                </>,
                <>
                  No Burner Profile yet? Create one at{" "}
                  <PageLink href="https://profiles.burningman.org">
                    profiles.burningman.org
                  </PageLink>
                  , then come back and sign in.
                </>,
              ]}
            />

            <Typography sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
              🏜️ On playa, at the Census Lab tablets
            </Typography>
            <Bullets
              items={[
                <>
                  Sign in with the passcode printed on your volunteer name
                  badge.
                </>,
              ]}
            />

            <Typography sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
              New volunteer without an account?
            </Typography>
            <Bullets
              items={[
                <>
                  <strong>🏠 From home:</strong> use the{" "}
                  <strong>Create an account</strong> link on the sign-in screen.
                </>,
                <>
                  <strong>🏜️ On playa:</strong> ask a lab host to set you up with
                  a name badge.
                </>,
              ]}
            />
          </Section>

          <Section
            id="signing-up"
            title="Signing up for shifts"
            expanded={open.has("signing-up")}
            onToggle={() => toggle("signing-up")}
          >
            <Typography sx={{ mb: 1 }}>
              Open <PageLink href="/shifts">Shifts</PageLink> from the menu.
              Shifts are grouped by day, and each card shows the time, how many
              spots are filled, and the points it&apos;s worth.
            </Typography>
            <Typography sx={{ mb: 1 }}>What the cards mean:</Typography>
            <Bullets
              items={[
                <>
                  <strong>✓ You&apos;re signed up</strong> — a shift you&apos;re
                  already on.
                </>,
                <>
                  <strong>You can sign up</strong> — an open shift you&apos;re
                  eligible for.
                </>,
                <>
                  <strong>Unavailable</strong> — grayed out, with the reason:{" "}
                  <strong>🚫 Full</strong> (no open spots),{" "}
                  <strong>🔒 Requires a role</strong> (a shift limited to a
                  specific crew), or <strong>⚠️ Overlaps</strong> another shift
                  you&apos;re already on.
                </>,
              ]}
            />
            <Typography sx={{ mt: 1, mb: 1 }}>
              <strong>To sign up:</strong> tap the shift, choose your position,
              then tap <strong>Add this shift</strong>.
            </Typography>
            <Typography sx={{ mb: 1 }}>
              <strong>To remove a shift:</strong> go to your{" "}
              <Jump to="vip">Volunteer Information Page (VIP)</Jump>, find the
              shift in your list, open its menu, and choose{" "}
              <strong>Remove shift</strong>. (A few lead or critical shifts
              can&apos;t be dropped on your own — reach out to a volunteer
              coordinator if you need off one of those.)
            </Typography>
            <Typography>
              Use the filter (funnel icon) to narrow by day, type, or
              availability — or turn on <strong>My Shifts</strong> to see just
              the ones you&apos;re on.
            </Typography>
          </Section>

          <Section
            id="vip"
            title="Your Volunteer Information Page (VIP)"
            expanded={open.has("vip")}
            onToggle={() => toggle("vip")}
          >
            <Typography sx={{ mb: 1 }}>
              Your <strong>Volunteer Information Page (VIP)</strong> — currently
              labeled <strong>Account</strong> in the menu — has a checklist of
              what to complete before playa:
            </Typography>
            <Bullets
              items={[
                <>
                  Required <Jump to="trainings">trainings</Jump> for the shifts
                  you sign up for
                </>,
                "The Behavioral Standards agreement",
                "The welcome course",
                "Keeping your Burner Profile up to date",
              ]}
            />
            <Typography sx={{ mt: 1 }}>
              Items check off automatically as you finish them — no need to
              report back.
            </Typography>
          </Section>

          <Section
            id="trainings"
            title="Trainings"
            expanded={open.has("trainings")}
            onToggle={() => toggle("trainings")}
          >
            <Typography sx={{ mb: 1 }}>
              Trainings live in the <strong>Census community on Hive</strong>{" "}
              (Burning Man&apos;s Hive platform). Complete each required course
              there:
            </Typography>
            <Steps
              items={[
                <>
                  On your <Jump to="vip">VIP checklist</Jump>, tap a course name
                  to open it in Hive.
                </>,
                <>
                  Log in with your Burner Profile — the same Burning Man login
                  as the app.
                </>,
                <>
                  Finish the course. When you&apos;re done, Hive may send you
                  back or ask you to log in again — <strong>that&apos;s
                  expected</strong>, you&apos;re not locked out. Head back to the
                  Census app.
                </>,
                <>
                  The course marks itself complete on your checklist. If a course
                  you&apos;ve finished still shows incomplete, open its link from
                  the checklist once more to sync it.
                </>,
              ]}
            />
            <Typography sx={{ mt: 1 }}>
              <strong>Heads up:</strong> because Hive uses the same Burning Man
              login as the Census app, finishing a course can feel like it
              logged you out. It didn&apos;t — just return to the app and
              you&apos;re still signed in.
            </Typography>
          </Section>

          <Section
            id="csp-sap"
            title="Shift points (CSP) & early entry (SAP)"
            expanded={open.has("csp-sap")}
            onToggle={() => toggle("csp-sap")}
          >
            <Bullets
              items={[
                <>
                  <strong>CSP (Census Shift Points):</strong> every shift is
                  worth points. Signing up for enough shifts meets your
                  volunteer commitment. Your{" "}
                  <Jump to="vip">VIP</Jump> shows your running total and anything
                  still needed.
                </>,
                <>
                  <strong>SAP (Setup Access Pass — early entry):</strong> if
                  you&apos;re arriving before the event opens to help with setup
                  shifts, you may need an early-entry pass. It&apos;s generally
                  issued for the day before your first shift. Staff, anyone who
                  already has a pass from another source, and folks arriving
                  after gates open don&apos;t need one. Set your{" "}
                  <strong>arrival date</strong> on your{" "}
                  <Jump to="vip">VIP</Jump> so this is calculated correctly.
                </>,
              ]}
            />
          </Section>

          <Section
            id="your-account"
            title="Your account details"
            expanded={open.has("your-account")}
            onToggle={() => toggle("your-account")}
          >
            <Typography sx={{ mb: 1 }}>
              On your <Jump to="vip">VIP</Jump> (menu → Account) you can:
            </Typography>
            <Bullets
              items={[
                "Update your playa name, world name, email, phone, location, and emergency contact.",
                "Set your arrival date (this drives your early-entry requirements).",
                "Manage your email preferences.",
                "View or reset your passcode.",
              ]}
            />
          </Section>

          <Section
            id="on-playa"
            title="🏜️ At the Census Lab (on playa)"
            expanded={open.has("on-playa")}
            onToggle={() => toggle("on-playa")}
          >
            <Typography sx={{ mb: 1 }}>
              The Census Lab has tablets for signing volunteers in, plus a kiosk
              anyone visiting can use.
            </Typography>
            <Bullets
              items={[
                <>
                  <strong>Checking a volunteer in:</strong> open{" "}
                  <PageLink href="/shifts">Shifts</PageLink>, tap the shift, find
                  the volunteer&apos;s name, and flip their toggle. The check-in
                  toggle appears from 1 hour before the shift starts until 2
                  hours after it ends.
                </>,
                <>
                  <strong>If the tablet interface isn&apos;t working:</strong>{" "}
                  let a shift lead or a member of Census leadership know so it
                  can be sorted out.
                </>,
                <>
                  For full step-by-step tablet instructions, see the printed{" "}
                  <strong>Census Lab Tablet Guide</strong> kept in the Census Lab
                  binder in the Data Entry Office.
                </>,
              ]}
            />
          </Section>

          <Section
            id="help"
            title="Still need help?"
            expanded={open.has("help")}
            onToggle={() => toggle("help")}
          >
            <Bullets
              items={[
                <>
                  Send a message from the{" "}
                  <PageLink href="/contact">Contact</PageLink> page (menu →
                  Contact) — pick a coordinator, or choose the technology option
                  for app issues.
                </>,
                <>
                  Join the conversation on the{" "}
                  <PageLink href="https://discord.com/invite/NNheeaPQRY">
                    Census Discord server
                  </PageLink>
                  .
                </>,
              ]}
            />
          </Section>
        </Box>
      </Container>
    </>
  );
};
