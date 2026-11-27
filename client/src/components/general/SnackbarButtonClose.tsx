import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useContext } from "react";

import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin } from "@/utils/checkIsRoleExist";

interface ISnackbarButtonCloseProps {
  snackbarKey: number | string;
}

const SnackbarButtonClose = ({ snackbarKey }: ISnackbarButtonCloseProps) => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: { accountType },
  } = useContext(DeveloperModeContext);
  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);

  // other hooks
  // ------------------------------------------------------------
  const { closeSnackbar } = useSnackbar();
  const theme = useTheme();

  // render
  // ------------------------------------------------------------
  return (
    <>
      {/* admins can copy a toast's text, e.g. to paste an error into a ticket (#105) */}
      {checkIsAdmin(accountType, roleList) && (
        <IconButton
          aria-label="Copy message"
          onClick={(e) =>
            navigator.clipboard?.writeText(
              e.currentTarget.closest("[role=alert]")?.textContent ?? ""
            )
          }
        >
          <ContentCopyIcon sx={{ color: theme.palette.common.white }} />
        </IconButton>
      )}
      <IconButton onClick={() => closeSnackbar(snackbarKey)}>
        <CloseIcon sx={{ color: theme.palette.common.white }} />
      </IconButton>
    </>
  );
};

export default SnackbarButtonClose;
