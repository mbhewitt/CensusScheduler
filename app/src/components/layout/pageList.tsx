import {
  Article as ArticleIcon,
  CalendarMonth as CalendarMonthIcon,
  Groups3 as Groups3Icon,
  Help as HelpIcon,
  Home as HomeIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";

export const pageListDefault = [
  {
    icon: <HomeIcon />,
    label: "Home",
    path: "/",
  },
  {
    icon: <CalendarMonthIcon />,
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
    icon: <VerifiedIcon />,
    label: "Roles",
    path: "/roles",
  },
];
