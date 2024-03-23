import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ReactNode } from "react";

interface ISnackbarTextProps {
  children: ReactNode;
}

export const SnackbarText = ({ children }: ISnackbarTextProps) => {
  // other hooks
  // --------------------
  const theme = useTheme();

  // display
  // --------------------
  return (
    <Typography
      sx={{
        color: theme.palette.common.white,
        fontSize: 14,
      }}
    >
      {children}
    </Typography>
  );
};
