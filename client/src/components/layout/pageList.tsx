import {
  Badge as BadgeIcon,
  BarChart as BarChartIcon,
  CalendarMonth as CalendarMonthIcon,
  EditNote as EditNoteIcon,
  EventNote as EventNoteIcon,
  Group as GroupIcon,
  Groups3 as Groups3Icon,
  ConfirmationNumber as ConfirmationNumberIcon,
  Help as HelpIcon,
  Home as HomeIcon,
  Print as PrintIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Settings as SettingsIcon,
  ShoppingBag as ShoppingBagIcon,
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
];
