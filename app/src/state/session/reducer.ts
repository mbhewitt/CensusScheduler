import type { IResVolunteerAccount } from "src/components/types";
import {
  AUTHENTICATE,
  BEHAVIORAL_STANDARDS_ADD,
  SESSION_STATE_STORAGE,
  SIGN_IN,
  SIGN_OUT,
  UNAUTHENTICATE,
} from "src/constants";

interface IBehavioralStandardsPayload {
  roleId: number;
  roleName: string;
}
export interface ISessionState {
  settings: {
    isAuthenticated: boolean;
  };
  user: IResVolunteerAccount;
}
export type ISessionAction =
  | { type: typeof AUTHENTICATE }
  | {
      payload: IBehavioralStandardsPayload;
      type: typeof BEHAVIORAL_STANDARDS_ADD;
    }
  | { payload: ISessionState; type: typeof SESSION_STATE_STORAGE }
  | { payload: IResVolunteerAccount; type: typeof SIGN_IN }
  | { type: typeof SIGN_OUT }
  | { type: typeof UNAUTHENTICATE };

export const sessionReducer = (
  state: ISessionState,
  action: ISessionAction
): ISessionState => {
  switch (action.type) {
    case AUTHENTICATE: {
      return structuredClone({
        settings: {
          isAuthenticated: true,
        },
        user: { ...state.user },
      });
    }
    case BEHAVIORAL_STANDARDS_ADD: {
      const stateClone = structuredClone(state);

      stateClone.user.roleList.push(action.payload);

      return stateClone;
    }
    case SESSION_STATE_STORAGE: {
      return structuredClone(action.payload);
    }
    case SIGN_IN: {
      return structuredClone({
        settings: {
          isAuthenticated: true,
        },
        user: action.payload,
      });
    }
    case SIGN_OUT: {
      return {
        settings: {
          isAuthenticated: false,
        },
        user: {
          email: "",
          emergencyContact: "",
          isVolunteerCreated: false,
          location: "",
          notes: "",
          phone: "",
          playaName: "",
          roleList: [],
          shiftboardId: 0,
          worldName: "",
        },
      };
    }
    case UNAUTHENTICATE: {
      return structuredClone({
        settings: {
          isAuthenticated: false,
        },
        user: { ...state.user },
      });
    }
    default: {
      const actionArg = action as ISessionAction;

      throw new Error(`Unknown action: ${actionArg.type}`);
    }
  }
};
