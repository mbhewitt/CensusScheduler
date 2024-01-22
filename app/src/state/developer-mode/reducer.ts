import { Dayjs } from "dayjs";

import { DEVELOPER_MODE_SET } from "src/constants";

export interface IDeveloperModeState {
  dateTime: {
    isEnabled: boolean;
    value: Dayjs;
  };
  disableIdle: {
    isEnabled: boolean;
  };
}

export type IDeveloperModeAction = {
  payload: {
    dateTime?: {
      isEnabled: boolean;
      value: Dayjs;
    };
    disableIdle?: {
      isEnabled: boolean;
    };
  };
  type: typeof DEVELOPER_MODE_SET;
};

export const developerModeReducer = (
  state: IDeveloperModeState,
  action: IDeveloperModeAction
) => {
  switch (action.type) {
    case DEVELOPER_MODE_SET: {
      return { ...state, ...action.payload };
    }
    default: {
      const actionArg = action as IDeveloperModeAction;

      throw new Error(`Unknown action type: ${actionArg.type}`);
    }
  }
};
