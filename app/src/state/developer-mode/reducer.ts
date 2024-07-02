import {
  DEVELOPER_MODE_ACCOUNT_TYPE,
  DEVELOPER_MODE_DATE_TIME,
  DEVELOPER_MODE_DISABLE_IDLE,
  DEVELOPER_MODE_RESET,
  DEVELOPER_MODE_STATE_STORAGE,
} from "src/constants";
import { dateTimeZone } from "src/utils/formatDateTime";

export interface IAccountTypePayload {
  isEnabled: boolean;
  value: string;
}
interface IDateTimePayload {
  isEnabled: boolean;
  value: string;
}
interface IDisableIdlePayload {
  isEnabled: boolean;
}
export interface IDeveloperModeState {
  accountType: IAccountTypePayload;
  dateTime: IDateTimePayload;
  disableIdle: IDisableIdlePayload;
}

export type IDeveloperModeAction =
  | {
      payload: IAccountTypePayload;
      type: typeof DEVELOPER_MODE_ACCOUNT_TYPE;
    }
  | {
      payload: IDateTimePayload;
      type: typeof DEVELOPER_MODE_DATE_TIME;
    }
  | {
      payload: IDisableIdlePayload;
      type: typeof DEVELOPER_MODE_DISABLE_IDLE;
    }
  | {
      type: typeof DEVELOPER_MODE_RESET;
    }
  | {
      payload: IDeveloperModeState;
      type: typeof DEVELOPER_MODE_STATE_STORAGE;
    };

export const developerModeReducer = (
  state: IDeveloperModeState,
  action: IDeveloperModeAction
) => {
  switch (action.type) {
    case DEVELOPER_MODE_ACCOUNT_TYPE: {
      return structuredClone({
        ...state,
        accountType: action.payload,
      });
    }
    case DEVELOPER_MODE_DATE_TIME: {
      return structuredClone({
        ...state,
        dateTime: action.payload,
      });
    }
    case DEVELOPER_MODE_DISABLE_IDLE: {
      return structuredClone({
        ...state,
        disableIdle: action.payload,
      });
    }
    case DEVELOPER_MODE_RESET: {
      return {
        accountType: {
          isEnabled: false,
          value: "",
        },
        dateTime: {
          isEnabled: false,
          value: dateTimeZone().toISOString(),
        },
        disableIdle: {
          isEnabled: false,
        },
      };
    }
    case DEVELOPER_MODE_STATE_STORAGE: {
      return structuredClone(action.payload);
    }
    default: {
      const actionArg = action as IDeveloperModeAction;

      throw new Error(`Unknown action type: ${actionArg.type}`);
    }
  }
};
