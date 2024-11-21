import type { IResVolunteerAccount } from "@/components/types/volunteers";
import {
  SESSION_ROLE_ITEM_ADD,
  SESSION_ROLE_ITEM_REMOVE,
  SESSION_SIGN_IN,
  SESSION_SIGN_OUT,
  SESSION_STATE_STORAGE,
} from "@/constants";

interface IRoleItemPayload {
  id: number;
  name: string;
}
export interface ISessionState {
  settings: {
    isAuthenticated: boolean;
  };
  user: IResVolunteerAccount;
}
export type ISessionAction =
  | {
      payload: IRoleItemPayload;
      type: typeof SESSION_ROLE_ITEM_ADD;
    }
  | {
      payload: IRoleItemPayload;
      type: typeof SESSION_ROLE_ITEM_REMOVE;
    }
  | { payload: IResVolunteerAccount; type: typeof SESSION_SIGN_IN }
  | { type: typeof SESSION_SIGN_OUT }
  | { payload: ISessionState; type: typeof SESSION_STATE_STORAGE };

export const sessionReducer = (
  state: ISessionState,
  action: ISessionAction
): ISessionState => {
  switch (action.type) {
    case SESSION_ROLE_ITEM_ADD: {
      const stateClone = structuredClone(state);

      stateClone.user.roleList.push(action.payload);

      return stateClone;
    }
    case SESSION_ROLE_ITEM_REMOVE: {
      const stateClone = structuredClone(state);

      stateClone.user.roleList = state.user.roleList.filter((roleItem) => {
        return roleItem.id !== action.payload.id;
      });

      return stateClone;
    }
    case SESSION_SIGN_IN: {
      return structuredClone({
        settings: {
          isAuthenticated: true,
        },
        user: action.payload,
      });
    }
    case SESSION_SIGN_OUT: {
      return {
        settings: {
          isAuthenticated: false,
        },
        user: {
          email: "",
          emergencyContact: "",
          isCreated: false,
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
    case SESSION_STATE_STORAGE: {
      return structuredClone(action.payload);
    }
    default: {
      const actionArg = action as ISessionAction;

      throw new Error(`Unknown action: ${actionArg.type}`);
    }
  }
};
