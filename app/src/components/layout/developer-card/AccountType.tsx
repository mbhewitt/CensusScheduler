import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useContext } from "react";

import type { TAccountActions } from "src/components/types";
import { ACCOUNT_TYPE_LIST } from "src/constants";
import { SessionContext } from "src/state/session/context";

export const AccountType = () => {
  const {
    sessionDispatch,
    sessionState: {
      developerMode: { accountType },
    },
  } = useContext(SessionContext);

  return (
    <FormControl fullWidth variant="standard">
      <InputLabel id="accountAction">Account type</InputLabel>
      <Select
        label="Account type"
        labelId="accountAction"
        onChange={(event) => {
          sessionDispatch({
            type: event.target.value as TAccountActions,
          });
        }}
        value={accountType}
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
