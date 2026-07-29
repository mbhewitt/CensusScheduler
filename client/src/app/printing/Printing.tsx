"use client";

import {
  Badge as BadgeIcon,
  Checklist as ChecklistIcon,
  Construction as ConstructionIcon,
  EditNote as EditNoteIcon,
  FactCheck as FactCheckIcon,
  Flight as FlightIcon,
  Keyboard as KeyboardIcon,
  Notes as NotesIcon,
  Science as ScienceIcon,
  ShoppingBag as ShoppingBagIcon,
  Traffic as TrafficIcon,
} from "@mui/icons-material";
import {
  Container,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import { Hero } from "@/components/layout/Hero";

// Every entry is a direct PDF download rendered from live data, so print
// runs always reflect the current signups.
interface IPrintItem {
  description: string;
  icon: ReactNode;
  label: string;
  path: string;
}

const labelItems: IPrintItem[] = [
  {
    description:
      "One label per volunteer with their schedule and Census secret (Avery 5523)",
    icon: <BadgeIcon />,
    label: "User Labels",
    path: "/api/labels",
  },
  {
    description: "Sampling bag labels — gate lanes plus airport/BxB (Avery 5523)",
    icon: <ShoppingBagIcon />,
    label: "Sampling Bags",
    path: "/api/labels/sampling",
  },
  {
    description: "Data Entry Wiz station labels",
    icon: <EditNoteIcon />,
    label: "Data Wiz",
    path: "/api/labels/data-wiz",
  },
];

const rosterItems: IPrintItem[] = [
  {
    description:
      "One roster page per gate shift: samplers by experience score, lane and clicker tallies",
    icon: <TrafficIcon />,
    label: "Gate Sampling p1",
    path: "/api/shift-sheets/gate-sampling",
  },
  {
    description:
      "Companion page per gate shift: meal timing estimates, checklist, and notes",
    icon: <ChecklistIcon />,
    label: "Gate Sampling p2",
    path: "/api/shift-sheets/gate-sampling?page=2",
  },
  {
    description:
      "One page per airport shift: roster, checklist, clicker/interval/planes, meal timing",
    icon: <FlightIcon />,
    label: "Airport Sampling",
    path: "/api/shift-sheets/airport-sampling",
  },
  {
    description:
      "One page per data entry shift: roster, checklist, pouches completed",
    icon: <KeyboardIcon />,
    label: "Data Entry",
    path: "/api/shift-sheets/data-entry",
  },
  {
    description:
      "One page per Lab Host and Pop Up Lab Host shift, each with its checklist",
    icon: <ScienceIcon />,
    label: "Lab Hosts",
    path: "/api/shift-sheets/lab-hosts",
  },
  {
    description:
      "One page per day covering setup, strike, trainings, and other larger shifts",
    icon: <ConstructionIcon />,
    label: "Daily Rosters",
    path: "/api/shift-sheets/daily",
  },
  {
    description:
      "Whole-burn list of shifts staffed by one or two people, with open slots",
    icon: <NotesIcon />,
    label: "Small Shifts",
    path: "/api/shift-sheets/compact",
  },
  {
    description:
      'Volunteers grouped by their first shift date — "initial next to your name"',
    icon: <FactCheckIcon />,
    label: "Check-In",
    path: "/api/shift-sheets/check-in",
  },
];

const PrintSection = ({
  items,
  title,
}: {
  items: IPrintItem[];
  title: string;
}) => (
  <Paper component="section" sx={{ mb: 4 }}>
    <Typography component="h2" sx={{ pl: 2, pt: 2 }} variant="h5">
      {title}
    </Typography>
    <List>
      {items.map(({ description, icon, label, path }) => (
        <ListItemButton
          component="a"
          href={path}
          key={path}
          sx={{ color: "inherit", textDecoration: "none" }}
          target="_blank"
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText
            primary={label}
            secondary={description}
            slotProps={{ secondary: { sx: { textDecoration: "none" } } }}
          />
        </ListItemButton>
      ))}
    </List>
  </Paper>
);

export const Printing = () => {
  // render
  // ------------------------------------------------------------
  return (
    <>
      <Hero
        imageStyles={{
          backgroundImage: "url(/banners/desk-group.jpg)",
          backgroundSize: "cover",
        }}
        text="Printing"
      />
      <Container component="main" sx={{ mb: 6 }}>
        <Typography sx={{ mb: 2 }}>
          Printable PDFs generated from live signup data. Each link opens the
          current version — print as close to the shift as possible.
        </Typography>
        <PrintSection items={labelItems} title="Labels" />
        <PrintSection items={rosterItems} title="Shift Rosters" />
      </Container>
    </>
  );
};
