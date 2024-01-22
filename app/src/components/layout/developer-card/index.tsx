import { Card, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useContext } from "react";

import { AccountType } from "src/components/layout/developer-card/AccountType";
import { DateTime } from "src/components/layout/developer-card/DateTime";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";

export const DeveloperCard = () => {
  const {
    sessionState: {
      developerMode: { isAccountTypeEnabled },
    },
  } = useContext(SessionContext);
  const {
    developerModeState: {
      dateTime: { isEnabled: isDateTimeEnabled },
    },
  } = useContext(DeveloperModeContext);
  const theme = useTheme();

  return (
    <Card
      sx={{
        bottom: theme.spacing(3),
        left: theme.spacing(3),
        minWidth: theme.spacing(25),
        p: 2,
        position: "fixed",
      }}
    >
      <Stack direction="column" spacing={2}>
        {isAccountTypeEnabled && <AccountType />}
        {isDateTimeEnabled && <DateTime />}
      </Stack>
    </Card>
  );
};
