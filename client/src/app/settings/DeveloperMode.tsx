import { RestartAlt as RestartAltIcon } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2 as Grid,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useContext } from "react";

import { SnackbarText } from "@/components/general/SnackbarText";
import {
  ACCOUNT_TYPE_ADMIN,
  DEVELOPER_MODE_ACCOUNT_TYPE,
  DEVELOPER_MODE_DATE_TIME,
  DEVELOPER_MODE_DISABLE_IDLE,
  DEVELOPER_MODE_RESET,
} from "@/constants";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { formatDateTime } from "@/utils/formatDateTime";

export const DeveloperMode = () => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeDispatch,
    developerModeState: {
      accountType: { isEnabled: isAccountTypeEnabled },
      dateTime: { isEnabled: isDateTimeEnabled },
      disableIdle: { isEnabled: isDisableIdleEnabled },
    },
  } = useContext(DeveloperModeContext);

  // other hooks
  // ------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();

  // logic
  // ------------------------------------------------------------
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

  // render
  // ------------------------------------------------------------
  return (
    <Grid container>
      <Grid size={6}>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
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
                        value: "",
                      },
                      type: DEVELOPER_MODE_ACCOUNT_TYPE,
                    });
                  }
                }}
              />
            }
            label="Mock account type"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isDateTimeEnabled}
                color="secondary"
                onChange={(event) => {
                  developerModeDispatch({
                    payload: {
                      isEnabled: event.target.checked,
                      value: formatDateTime(),
                    },
                    type: DEVELOPER_MODE_DATE_TIME,
                  });
                }}
              />
            }
            label="Mock date and time"
          />
          <FormControlLabel
            control={
              <Checkbox
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
            label="Disable idle logout"
          />
        </FormGroup>
      </Grid>
      <Grid
        container
        justifyContent="flex-end"
        size={12}
        sx={{
          mt: 2,
        }}
      >
        <Button
          onClick={onReset}
          startIcon={<RestartAltIcon />}
          type="button"
          variant="contained"
        >
          Reset settings
        </Button>
      </Grid>
    </Grid>
  );
};
