import {
  Article as ArticleIcon,
  CalendarMonth as CalendarMonthIcon,
  EventNote as EventNoteIcon,
  Group as GroupIcon,
  Groups3 as Groups3Icon,
  Help as HelpIcon,
  Home as HomeIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Settings as SettingsIcon,
  VerifiedUser as VerifiedUserIcon,
  ViewList as ViewListIcon,
  Work as WorkIcon,
} from "@mui/icons-material";

export const pageListDefault = [
  {
    icon: <HomeIcon />,
    label: "Home",
    path: "/",
  },
  {
    icon: <WorkIcon />,
    label: "Shifts",
    path: "/shifts",
  },
  {
    icon: <ArticleIcon />,
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
  // {
  //   icon: <CalendarMonthIcon />,
  //   label: "Calendar",
  //   path: "/calendar",
  // },
  {
    icon: <WorkIcon />,
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
