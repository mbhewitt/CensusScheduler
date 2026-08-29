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

import NextLink from "next/link";
import { Fragment, type ReactNode, useContext } from "react";

import { Hero } from "@/components/layout/Hero";
import { SessionContext } from "@/state/session/context";

// Rebuilt from the 2026 Tablet Quick-Reference cheat sheet (per Chipper,
// 2026-08-29). Every mention of an in-app page (Account, Training, Shifts,
// Contact, Sign in, Reports, Volunteers, Home) is auto-linked on EVERY
// occurrence — not just the first — via linkify() below.

// Page terms → destination, longest-first so multi-word terms win. `acct`
// resolves at render time (the signed-in volunteer's own info page, else the
// sign-in page). `off_playa` external links aren't used here — the cheat sheet
// is entirely in-app navigation.
const linkTerms = (acct: string): { term: string; href: string }[] => [
  { term: "Account page", href: acct },
  { term: "Shifts page", href: "/shifts" },
  { term: "Contact page", href: "/contact" },
  { term: "Reports page", href: "/reports" },
  { term: "Volunteers page", href: "/volunteers" },
  { term: "Home page", href: "/" },
  { term: "Sign in", href: "/sign-in" },
  { term: "Sign-in", href: "/sign-in" },
  { term: "Trainings", href: "/training" },
  { term: "Training", href: "/training" },
  { term: "Account", href: acct },
  { term: "Shifts", href: "/shifts" },
  { term: "Contact", href: "/contact" },
  { term: "Reports", href: "/reports" },
  { term: "Volunteers", href: "/volunteers" },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Wrap EVERY occurrence of a known page term in an in-app link, preserving the
// original casing of the matched text. Word-boundary + case-insensitive so
// "account", "Account", and "Account page" all link, but "accounts" inside a
// larger word won't false-match awkwardly.
const linkify = (text: string, acct: string): ReactNode => {
  const terms = linkTerms(acct);
  const re = new RegExp(
    `\\b(${terms.map((t) => escapeRe(t.term)).join("|")})\\b`,
    "gi"
  );
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const matched = m[0];
    const found = terms.find((t) => t.term.toLowerCase() === matched.toLowerCase());
    out.push(
      <NextLink key={key++} href={found ? found.href : "#"}>
        {matched}
      </NextLink>
    );
    last = m.index + matched.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

interface Bullet {
  label?: string;
  text: string;
}
interface HelpSection {
  title: string;
  intro?: string;
  bullets: Bullet[];
}

const SECTIONS: HelpSection[] = [
  {
    title: "Census Wi-Fi",
    bullets: [
      {
        label: "Wi-Fi, not internet",
        text: "The pink tablets connect to the Census Lab's local Wi-Fi so CensusScheduler can reach the on-playa server. This does not provide internet access.",
      },
      {
        label: "Ignore internet warnings",
        text: "Android or Chrome may say No internet, Connected without internet, or Offline. If CensusScheduler opens and pages update, the connection is working normally — do not switch networks just because the tablet says there is no internet.",
      },
      {
        label: "Troubleshooting network problems",
        text: "If the app will not load, be sure Wi-Fi is turned on and the tablet is connected to the Census Tablets network. If it still does not open or update, ask a Lab Host, Census Shift Lead, or Census tech for help.",
      },
    ],
  },
  {
    title: "Census Training",
    bullets: [
      {
        text: "Training is now available offline directly through the app on the pink tablets — no internet or Hive connection needed. Be sure you are signed in to receive credit for completing the Training.",
      },
      {
        label: "Finding your Training",
        text: "Sign in, open your Account page, and expand any incomplete Training checklist item. Your Account page shows the courses that apply to you. You can also browse all courses on the Training page.",
      },
    ],
  },
  {
    title: "Your account",
    bullets: [
      {
        label: "New volunteers",
        text: "You can create a Census volunteer account directly from the app. Open the main menu (☰) at the top-left, select Sign in, then click New account.",
      },
      {
        label: "Locating your passcode",
        text: "Find your unique four-digit passcode printed on the corner of the sticker on the back of your physical Census name badge. This code is assigned specifically to your account.",
      },
      {
        label: "Signing in",
        text: "Open the main menu (☰), select Sign in, choose the Volunteer field, search by typing the first few letters of your name, select your name, enter your passcode, and tap Sign in.",
      },
      {
        label: "Declining browser prompts",
        text: "Never allow Google Chrome to save your passcode — pink tablets are shared. Always decline or dismiss any auto-save prompts from Chrome.",
      },
      {
        label: "Behavioral Standards Agreement",
        text: "All volunteers are asked to sign this agreement prior to their first shift. If unsigned, a red hand appears on your name badge. On signing in, you'll automatically be directed to review and sign.",
      },
    ],
  },
  {
    title: "Managing your schedule",
    bullets: [
      {
        label: "Viewing my shifts",
        text: "Go to your Account page and scroll to the Shifts section for a full list of your assigned dates, times, roles, and check-in statuses.",
      },
      {
        label: "Checking in to your shift",
        text: "Toggle the pink Check in switch in your Account shifts list. This on-playa feature only becomes active when your shift is currently in progress. Gray indicates unchecked; pink confirms checked in.",
      },
      {
        label: "Self-signing up (Add shift)",
        text: "Tap Add shift on your Account page. Browse or filter the Shifts schedule (open shifts show their Filled count in bold pink). Select a shift row, choose an available position, and tap Add this shift.",
      },
      {
        label: "Removing yourself",
        text: "Tap the more-options menu (•••) next to the shift, select Remove shift, and confirm. If the position is marked critical, you must acknowledge a warning. This immediately notifies the Volunteer Coordinators.",
      },
      {
        label: "Same shift, different position",
        text: "The app does not change positions in place. To switch positions within a shift, remove yourself from the shift, then add the new position.",
      },
    ],
  },
  {
    title: "Leaving safely",
    bullets: [
      {
        text: "Tablet kiosks are shared by many volunteers, so protecting private data is a team responsibility.",
      },
      {
        label: "Always sign out",
        text: "To keep your personal details confidential, always click Sign out in the main menu when you finish. Leaving an active session lets other tablet users see your information.",
      },
      {
        label: "Automatic timeout",
        text: "The app automatically logs you out if left completely idle for five minutes.",
      },
      {
        label: "Returning tablets",
        text: "Other than stationary kiosk setups, always return portable tablets directly to a Lab Host or Shift Lead.",
      },
    ],
  },
  {
    title: "Shift Lead & Lab Host — tablet custody and care",
    intro:
      "For designated helpers only: Shift Leads, Lab Hosts, and leadership volunteers.",
    bullets: [
      {
        label: "Physical security",
        text: "Tablets are vital assets donated by volunteers. Never leave a tablet unattended — keep them in your hands or in secure storage in the Data Entry Office.",
      },
      {
        label: "Custody and charging",
        text: "Retrieve tablets from the desk on the right inside the Data Entry Office. Verify they are on and check their charge before your shift. Return them to the charging station immediately afterward.",
      },
    ],
  },
  {
    title: "Shift Lead & Lab Host — managing shifts and rosters",
    bullets: [
      {
        label: "Roster operations",
        text: "The Shifts page is the one documented route for all roster actions. Open the main menu, select Shifts, and select the correct shift row.",
      },
      {
        label: "Checking in a volunteer",
        text: "Find the volunteer's name on the roster and toggle their Check in switch on the right. Once checked in, the switch turns from light gray to pink and a green confirmation banner appears.",
      },
      {
        label: "Check-in window",
        text: "Shift Leads can check volunteers in starting one hour before and up to two hours after the scheduled shift.",
      },
      {
        label: "Adding a volunteer",
        text: "On the Shift Detail page, select Add volunteer, search for their name, select their position, and click Add volunteer to confirm.",
      },
      {
        label: "Removing a volunteer",
        text: "Open the actions menu (•••) next to their name and select Remove volunteer. If the position is critical, acknowledge the warning to proceed.",
      },
      {
        label: "Overriding restrictions",
        text: "Leads can override schedule overlaps or position limits. The app notifies you of time conflicts with an orange banner.",
      },
    ],
  },
  {
    title: "Shift Lead & Lab Host — conducting shift reviews",
    bullets: [
      {
        label: "Reviewing performance",
        text: "Enter reviews at the end of every shift. In the roster, click the gray chat bubble with a pencil icon in the Admin Review column next to the volunteer's name.",
      },
      {
        label: "Ratings and notes",
        text: "The default rating is Meets expectations. For standout volunteers, add specific praise. If someone is marked Not a good fit (e.g., disruptive behavior), provide constructive notes.",
      },
      {
        label: "Sensitive information",
        text: "Do not type highly sensitive details into the tablet database. Write a brief note such as 'See Cinnamon regarding specifics' to keep records secure.",
      },
      {
        label: "Visual status",
        text: "The review icon turns pink once notes and ratings are successfully saved.",
      },
    ],
  },
  {
    title: "Shift Lead & Lab Host — volunteer account assistance",
    bullets: [
      {
        label: "Account lookup",
        text: "The Volunteers page is the one documented route for account help. Use the magnifying-glass icon to search by preferred playa name or default world name.",
      },
      {
        label: "Resetting a passcode",
        text: "Helpers can reset passcodes but can never view existing ones. If a volunteer is locked out, search their name, open their record, scroll to Security > Passcode, and tap Update passcode. Hand the tablet to the volunteer to enter and confirm a new four-digit passcode, then tap Update passcode.",
      },
      {
        label: "Admin notes",
        text: "Scroll to Admin > Notes to record general, non-shift on-playa changes (e.g., travel delays) and click Update notes.",
      },
    ],
  },
  {
    title: "Emergency fallback and support",
    bullets: [
      {
        label: "The Master Binder",
        text: "If the app or local network is down, retrieve the hard-copy shift schedules in the Census Master Binder in the Data Entry Office. Volunteers can locate their names and check in manually.",
      },
      {
        label: "Who's who",
        text: "For technical problems or tablet help, find one of our tablet experts: Captain Mew, Prizmo, Chipper, Rescue, Cinnamon, Woodie, or SimCard. You can also reach the Census tech team from the Contact page.",
      },
    ],
  },
];

export const Help = () => {
  const {
    sessionState: {
      user: { shiftboardId },
    },
  } = useContext(SessionContext);
  // "Account" links to the signed-in volunteer's own page; when signed out we
  // send them to Sign in (from which they reach their account).
  const acct = shiftboardId ? `/volunteers/${shiftboardId}/info` : "/sign-in";

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
                Welcome to Black Rock City Census! These are quick-reference steps
                for using the offline pink tablets at the Lab and navigating the
                Census app. Whether you&apos;re a visitor browsing{" "}
                {linkify("Reports", acct)} or a volunteer managing your{" "}
                {linkify("Shifts", acct)}, tap any section below to open it.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          {SECTIONS.map((section) => (
            <Accordion key={section.title} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>{section.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {section.intro && (
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {linkify(section.intro, acct)}
                  </Typography>
                )}
                <List disablePadding sx={{ listStyle: "disc", pl: 4 }}>
                  {section.bullets.map((b, i) => (
                    <ListItem
                      key={i}
                      disablePadding
                      sx={{ display: "list-item", mb: 0.5 }}
                    >
                      <ListItemText
                        primary={
                          <Fragment>
                            {b.label && <strong>{b.label}: </strong>}
                            {linkify(b.text, acct)}
                          </Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </>
  );
};
