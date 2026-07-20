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

import type { ReactNode } from "react";

import { Hero } from "@/components/layout/Hero";

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

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Accordion disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

export const Help = () => {
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
              <Typography>
                Welcome! This page walks you through using the Census volunteer
                app — signing in, signing up for shifts, your checklist,
                trainings, and more. Tap any section below to open it. If
                you&apos;re using a tablet at the Census Lab on playa, jump to{" "}
                <strong>At the Census Lab (on playa)</strong> near the bottom.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Section title="Getting started — signing in">
            <Bullets
              items={[
                <>
                  <strong>From home, on your own device:</strong> open the{" "}
                  <strong>Home</strong> page and use{" "}
                  <strong>Sign in to Census</strong>. You&apos;ll sign in with
                  your Burner Profile. Don&apos;t have one yet? Create it at{" "}
                  <a
                    href="https://profiles.burningman.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    profiles.burningman.org
                  </a>
                  .
                </>,
                <>
                  <strong>On the Census Lab tablets (on playa):</strong> sign in
                  with the passcode printed on your volunteer name badge.
                </>,
                <>
                  <strong>New volunteer without an account?</strong> Use the{" "}
                  <strong>Create an account</strong> link on the sign-in screen,
                  or ask a lab host to set you up with a name badge.
                </>,
              ]}
            />
          </Section>

          <Section title="Signing up for shifts">
            <Typography sx={{ mb: 1 }}>
              Open <strong>Shifts</strong> from the menu. Shifts are grouped by
              day, and each card shows the time, how many spots are filled, and
              the points it&apos;s worth.
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
              <strong>Account</strong> page, find the shift in your list, open
              its menu, and choose <strong>Remove shift</strong>. (A few lead or
              critical shifts can&apos;t be dropped on your own — reach out to a
              volunteer coordinator if you need off one of those.)
            </Typography>
            <Typography>
              Use the filter (funnel icon) to narrow by day, type, or
              availability — or turn on <strong>My Shifts</strong> to see just
              the ones you&apos;re on.
            </Typography>
          </Section>

          <Section title="Your checklist">
            <Typography sx={{ mb: 1 }}>
              Your <strong>Account</strong> page has a checklist of what to
              complete before playa:
            </Typography>
            <Bullets
              items={[
                "Required trainings for the shifts you sign up for",
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

          <Section title="Trainings">
            <Bullets
              items={[
                <>
                  Trainings live in the <strong>Census community on Hive</strong>{" "}
                  (Burning Man&apos;s Hive platform). Complete each required
                  course there.
                </>,
                <>
                  On your checklist, tap a course name to open it in Hive, then
                  log in with your Burner Profile.
                </>,
                <>
                  When you finish a course, it&apos;s marked complete on your
                  checklist. If a course you&apos;ve finished still shows as
                  incomplete, open its link from the checklist once more to sync
                  it.
                </>,
              ]}
            />
          </Section>

          <Section title="Shift points (CSP) & early entry (SAP)">
            <Bullets
              items={[
                <>
                  <strong>CSP (Census Shift Points):</strong> every shift is
                  worth points. Signing up for enough shifts meets your
                  volunteer commitment. Your Account page shows your running
                  total and anything still needed.
                </>,
                <>
                  <strong>SAP (early-entry access):</strong> if you&apos;re
                  arriving before the event opens to help with setup shifts, you
                  may need an early-entry pass. It&apos;s generally issued for
                  the day before your first shift. Staff, anyone who already has
                  a pass from another source, and folks arriving after gates
                  open don&apos;t need one. Set your{" "}
                  <strong>arrival date</strong> on your Account page so this is
                  calculated correctly.
                </>,
              ]}
            />
          </Section>

          <Section title="Your account">
            <Bullets
              items={[
                "Update your playa name, world name, email, phone, location, and emergency contact.",
                "Set your arrival date (this drives your early-entry requirements).",
                "Manage your email preferences.",
                "View or reset your passcode.",
              ]}
            />
          </Section>

          <Section title="At the Census Lab (on playa)">
            <Typography sx={{ mb: 1 }}>
              The Census Lab has tablets for signing volunteers in, plus a kiosk
              anyone visiting can use.
            </Typography>
            <Bullets
              items={[
                <>
                  <strong>Checking a volunteer in:</strong> open{" "}
                  <strong>Shifts</strong>, tap the shift, find the
                  volunteer&apos;s name, and flip their toggle. The check-in
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

          <Section title="Still need help?">
            <Bullets
              items={[
                <>
                  Send a message from the <strong>Contact</strong> page (menu →
                  Contact) — pick a coordinator, or choose the technology option
                  for app issues.
                </>,
                <>
                  Join the conversation on the{" "}
                  <a
                    href="https://discord.com/invite/NNheeaPQRY"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Census Discord server
                  </a>
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
