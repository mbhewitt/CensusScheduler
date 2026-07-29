import {
  Badge as BadgeIcon,
  BarChart as BarChartIcon,
  CalendarMonth as CalendarMonthIcon,
  Checklist as ChecklistIcon,
  Construction as ConstructionIcon,
  EditNote as EditNoteIcon,
  EventNote as EventNoteIcon,
  FactCheck as FactCheckIcon,
  Flight as FlightIcon,
  Group as GroupIcon,
  Groups3 as Groups3Icon,
  ConfirmationNumber as ConfirmationNumberIcon,
  Help as HelpIcon,
  Home as HomeIcon,
  Keyboard as KeyboardIcon,
  Notes as NotesIcon,
  Print as PrintIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Science as ScienceIcon,
  Settings as SettingsIcon,
  ShoppingBag as ShoppingBagIcon,
  Traffic as TrafficIcon,
  VerifiedUser as VerifiedUserIcon,
  ViewList as ViewListIcon,
  WorkHistory as WorkHistoryIcon,
} from "@mui/icons-material";

export const pageListDefault = [
  {
    icon: <HomeIcon />,
    label: "Home",
    path: "/",
  },
  {
    icon: <WorkHistoryIcon />,
    label: "Shifts",
    path: "/shifts",
  },
  {
    icon: <BarChartIcon />,
    label: "Reports",
    path: "/reports",
  },
  {
    icon: <HelpIcon />,
    label: "Help",
    path: "/help",
  },
  {
    icon: <QuestionAnswerIcon />,
    label: "Contact",
    path: "/contact",
  },
];
export const pageListAdmin = [
  {
    icon: <Groups3Icon />,
    label: "Volunteers",
    path: "/volunteers",
  },
  {
    icon: <VerifiedUserIcon />,
    label: "Roles",
    path: "/roles",
  },
  {
    icon: <SettingsIcon />,
    label: "Settings",
    path: "/settings",
  },
];
export const pageListSuperAdmin = [
  {
    icon: <CalendarMonthIcon />,
    label: "Dates",
    path: "/dates",
  },
  {
    icon: <ConfirmationNumberIcon />,
    label: "SAPs",
    path: "/saps",
  },
  {
    // direct PDF downloads (Avery 2x4in label sheets), not app pages
    icon: <PrintIcon />,
    label: "Labels",
    path: "",
    children: [
      {
        icon: <BadgeIcon />,
        label: "User Labels",
        path: "/api/labels",
      },
      {
        icon: <ShoppingBagIcon />,
        label: "Sampling Bags",
        path: "/api/labels/sampling",
      },
      {
        icon: <EditNoteIcon />,
        label: "Data Wiz",
        path: "/api/labels/data-wiz",
      },
    ],
  },
  {
    icon: <WorkHistoryIcon />,
    label: "Shifts",
    path: "",
    children: [
      {
        icon: <ViewListIcon />,
        label: "Categories",
        path: "/shifts/categories",
      },
      {
        icon: <GroupIcon />,
        label: "Positions",
        path: "/shifts/positions",
      },
      {
        icon: <EventNoteIcon />,
        label: "Types",
        path: "/shifts/types",
      },
    ],
  },
  {
    // direct PDF downloads — printed shift rosters (legacy schedPrint)
    icon: <PrintIcon />,
    label: "Shift Sheets",
    path: "",
    children: [
      {
        icon: <TrafficIcon />,
        label: "Gate Sampling p1",
        path: "/api/shift-sheets/gate-sampling",
      },
      {
        icon: <ChecklistIcon />,
        label: "Gate Sampling p2",
        path: "/api/shift-sheets/gate-sampling?page=2",
      },
      {
        icon: <FlightIcon />,
        label: "Airport Sampling",
        path: "/api/shift-sheets/airport-sampling",
      },
      {
        icon: <KeyboardIcon />,
        label: "Data Entry",
        path: "/api/shift-sheets/data-entry",
      },
      {
        icon: <ScienceIcon />,
        label: "Lab Hosts",
        path: "/api/shift-sheets/lab-hosts",
      },
      {
        icon: <ConstructionIcon />,
        label: "Setup / Strike",
        path: "/api/shift-sheets/daily",
      },
      {
        icon: <NotesIcon />,
        label: "Small Shifts",
        path: "/api/shift-sheets/compact",
      },
      {
        icon: <FactCheckIcon />,
        label: "Check-In",
        path: "/api/shift-sheets/check-in",
      },
    ],
  },
];
