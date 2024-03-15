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
  DEVELOPER_MODE_ACCOUNT_TYPE,
  DEVELOPER_MODE_DATE_TIME,
  DEVELOPER_MODE_DISABLE_IDLE,
  DEVELOPER_MODE_RESET,
} from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";

export const DeveloperMode = () => {
  const {
    developerModeDispatch,
    developerModeState: {
      accountType: { isEnabled: isAccountTypeEnabled },
      dateTime: { isEnabled: isDateTimeEnabled },
      disableIdle: { isEnabled: isDisableIdleEnabled },
    },
  } = useContext(DeveloperModeContext);
  const { enqueueSnackbar } = useSnackbar();

  const onReset = () => {
    developerModeDispatch({
      type: DEVELOPER_MODE_RESET,
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
                    developerModeDispatch({
                      payload: {
                        isEnabled: true,
                        value: ACCOUNT_TYPE_ADMIN,
                      },
                      type: DEVELOPER_MODE_ACCOUNT_TYPE,
                    });
                  } else {
                    developerModeDispatch({
                      payload: {
                        isEnabled: false,
                        value: ACCOUNT_TYPE_ADMIN,
                      },
                      type: DEVELOPER_MODE_ACCOUNT_TYPE,
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
                      isEnabled: event.target.checked,
                      value: dayjs().toISOString(),
                    },
                    type: DEVELOPER_MODE_DATE_TIME,
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
                      isEnabled: event.target.checked,
                    },
                    type: DEVELOPER_MODE_DISABLE_IDLE,
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
