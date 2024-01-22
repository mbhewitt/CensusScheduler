import {
  ACCOUNT_TYPE_ADMIN,
  ACCOUNT_TYPE_AUTHENTICATED,
  ACCOUNT_TYPE_RESET,
  ACCOUNT_TYPE_UNAUTHENTICATED,
  BEHAVIORAL_STANDARDS_SET,
  SESSION_STATE_STORAGE,
  SIGN_IN,
  SIGN_OUT,
} from "src/constants";

interface IBehavioralStandardsPayload {
  isBehavioralStandardsSigned: boolean;
}
interface ISessionPayload extends IBehavioralStandardsPayload {
  email: string;
  isCoreCrew: boolean;
  playaName: string;
  shiftboardId: string;
  worldName: string;
}
export interface ISessionState {
  developerMode: {
    accountType: string;
    isAccountTypeEnabled: boolean;
  };
  settings: {
    isAuthenticated: boolean;
  };
  user: ISessionPayload;
}
export type ISessionAction =
  | { payload: ISessionPayload; type: typeof SIGN_IN }
  | { type: typeof SIGN_OUT }
  | {
      payload: IBehavioralStandardsPayload;
      type: typeof BEHAVIORAL_STANDARDS_SET;
    }
  | { type: typeof ACCOUNT_TYPE_ADMIN }
  | { type: typeof ACCOUNT_TYPE_AUTHENTICATED }
  | { type: typeof ACCOUNT_TYPE_UNAUTHENTICATED }
  | { type: typeof ACCOUNT_TYPE_RESET }
  | { payload: ISessionState; type: typeof SESSION_STATE_STORAGE };

export const sessionReducer = (
  state: ISessionState,
  action: ISessionAction
): ISessionState => {
  switch (action.type) {
    case ACCOUNT_TYPE_ADMIN: {
      return structuredClone({
        developerMode: {
          accountType: ACCOUNT_TYPE_ADMIN,
          isAccountTypeEnabled: true,
        },
        settings: {
          isAuthenticated: true,
        },
        user: {
          ...state.user,
          isCoreCrew: true,
        },
      });
    }
    case ACCOUNT_TYPE_AUTHENTICATED: {
      return structuredClone({
        developerMode: {
          accountType: ACCOUNT_TYPE_AUTHENTICATED,
          isAccountTypeEnabled: true,
        },
        settings: {
          isAuthenticated: true,
        },
        user: {
          ...state.user,
          isCoreCrew: false,
        },
      });
    }
    case ACCOUNT_TYPE_RESET: {
      return structuredClone({
        developerMode: {
          accountType: ACCOUNT_TYPE_ADMIN,
          isAccountTypeEnabled: false,
        },
        settings: {
          isAuthenticated: true,
        },
        user: { ...state.user, isCoreCrew: true },
      });
    }
    case ACCOUNT_TYPE_UNAUTHENTICATED: {
      return structuredClone({
        developerMode: {
          accountType: ACCOUNT_TYPE_UNAUTHENTICATED,
          isAccountTypeEnabled: true,
        },
        settings: {
          isAuthenticated: false,
        },
        user: {
          ...state.user,
          isCoreCrew: false,
        },
      });
    }
    case BEHAVIORAL_STANDARDS_SET: {
      return structuredClone({
        developerMode: {
          ...state.developerMode,
        },
        settings: {
          ...state.settings,
        },
        user: {
          ...state.user,
          isBehavioralStandardsSigned:
            action.payload.isBehavioralStandardsSigned,
        },
      });
    }
    case SESSION_STATE_STORAGE: {
      return structuredClone(action.payload);
    }
    case SIGN_IN: {
      return structuredClone({
        developerMode: {
          accountType: ACCOUNT_TYPE_ADMIN,
          isAccountTypeEnabled: false,
        },
        settings: {
          isAuthenticated: true,
        },
        user: action.payload,
      });
    }
    case SIGN_OUT: {
      return {
        developerMode: {
          accountType: ACCOUNT_TYPE_ADMIN,
          isAccountTypeEnabled: false,
        },
        settings: {
          isAuthenticated: false,
        },
        user: {
          email: "",
          isBehavioralStandardsSigned: false,
          isCoreCrew: false,
          playaName: "",
          shiftboardId: "",
          worldName: "",
        },
      };
    }
    default: {
      const actionArg = action as ISessionAction;

      throw new Error(`Unknown action: ${actionArg.type}`);
    }
  }
};
