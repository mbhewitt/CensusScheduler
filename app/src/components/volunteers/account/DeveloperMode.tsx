import { RestartAlt as RestartAltIcon } from "@mui/icons-material";
import {
  Button,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import { useContext } from "react";

import { SnackbarText } from "src/components/general/SnackbarText";
import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_RESET,
  DEVELOPER_MODE_SET,
} from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { SessionContext } from "src/state/session/context";

export const DeveloperMode = () => {
  const {
    sessionDispatch,
    sessionState: {
      developerMode: { isAccountTypeEnabled },
    },
  } = useContext(SessionContext);
  const {
    developerModeState: {
      dateTime: { isEnabled: isDateTimeEnabled },
      disableIdle: { isEnabled: isDisableIdleEnabled },
    },
    developerModeDispatch,
  } = useContext(DeveloperModeContext);
  const { enqueueSnackbar } = useSnackbar();

  const onReset = () => {
    developerModeDispatch({
      payload: {
        dateTime: {
          isEnabled: false,
          value: dayjs(),
        },
        disableIdle: {
          isEnabled: false,
        },
      },
      type: DEVELOPER_MODE_SET,
    });
    sessionDispatch({
      type: ACCOUNT_TYPE_RESET,
    });

    enqueueSnackbar(
      <SnackbarText>Developer mode settings have been reset</SnackbarText>,
      {
        variant: "success",
      }
    );
  };

  return (
    <>
      <Grid item xs={4}>
        <Typography component="h3" variant="h6" sx={{ mb: 1 }}>
          Developer mode
        </Typography>
      </Grid>
      <Grid item xs={8}>
        <Stack direction="column" sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isAccountTypeEnabled}
                color="secondary"
                onChange={(event) => {
                  if (event.target.checked) {
                    sessionDispatch({
                      type: ACCOUNT_TYPE_ADMIN,
                    });
                  } else {
                    sessionDispatch({
                      type: ACCOUNT_TYPE_RESET,
                    });
                  }
                }}
              />
            }
            label="Account type"
          />
          <FormControlLabel
            control={
              <Switch
                checked={isDateTimeEnabled}
                color="secondary"
                onChange={(event) => {
                  developerModeDispatch({
                    payload: {
                      dateTime: {
                        isEnabled: event.target.checked,
                        value: dayjs(),
                      },
                    },
                    type: DEVELOPER_MODE_SET,
                  });
                }}
              />
            }
            label="Date and time"
          />
          <FormControlLabel
            control={
              <Switch
                checked={isDisableIdleEnabled}
                color="secondary"
                onChange={(event) => {
                  developerModeDispatch({
                    payload: {
                      disableIdle: {
                        isEnabled: event.target.checked,
                      },
                    },
                    type: DEVELOPER_MODE_SET,
                  });
                }}
              />
            }
            label="Disable idle"
          />
        </Stack>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            onClick={onReset}
            startIcon={<RestartAltIcon />}
            type="button"
            variant="contained"
          >
            Reset settings
          </Button>
        </Stack>
      </Grid>
    </>
  );
};
