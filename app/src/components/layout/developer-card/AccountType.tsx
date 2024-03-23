import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useContext } from "react";

import { ACCOUNT_TYPE_LIST, DEVELOPER_MODE_ACCOUNT_TYPE } from "src/constants";
import { DeveloperModeContext } from "src/state/developer-mode/context";

export const AccountType = () => {
  // context
  // --------------------
  const {
    developerModeDispatch,
    developerModeState: {
      accountType: { value },
    },
  } = useContext(DeveloperModeContext);

  // display
  // --------------------
  return (
    <FormControl fullWidth variant="standard">
      <InputLabel id="accountAction">Account type</InputLabel>
      <Select
        label="Account type"
        labelId="accountAction"
        onChange={(event) => {
          developerModeDispatch({
            payload: { isEnabled: true, value: event.target.value },
            type: DEVELOPER_MODE_ACCOUNT_TYPE,
          });
        }}
        value={value}
      >
        {ACCOUNT_TYPE_LIST.map(({ label, value }) => (
          <MenuItem key={`${value}`} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
