import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ReactNode } from "react";

interface ISnackbarText {
  children: ReactNode;
}

export const SnackbarText = ({ children }: ISnackbarText) => {
  const theme = useTheme();

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
