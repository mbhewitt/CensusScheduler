import { NavigateNext as NavigateNextIcon } from "@mui/icons-material";
import { Breadcrumbs } from "@mui/material";

interface IBreadcrumbsNav {
  children: React.ReactNode;
}

export const BreadcrumbsNav = ({ children }: IBreadcrumbsNav) => {
  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
      {children}
    </Breadcrumbs>
  );
};
