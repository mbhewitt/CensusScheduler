import { Close as CloseIcon } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import * as React from "react";

interface ISnackbarButtonCloseProps {
  snackbarKey: number | string;
}

const SnackbarButtonClose = ({ snackbarKey }: ISnackbarButtonCloseProps) => {
  const { closeSnackbar } = useSnackbar();
  const theme = useTheme();

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)}>
      <CloseIcon sx={{ color: theme.palette.common.white }} />
    </IconButton>
  );
};

export default SnackbarButtonClose;
