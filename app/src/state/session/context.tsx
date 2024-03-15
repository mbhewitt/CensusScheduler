import {
  createContext,
  Dispatch,
  ReactNode,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import { SESSION_STATE_STORAGE } from "src/constants";
import {
  ISessionAction,
  ISessionState,
  sessionReducer,
} from "src/state/session/reducer";

interface ISessionProviderValue {
  sessionState: ISessionState;
  sessionDispatch: Dispatch<ISessionAction>;
}
interface ISessionProviderProps {
  children: ReactNode;
}

export const SessionContext = createContext({} as ISessionProviderValue);

const sessionInitial: ISessionState = {
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
  settings: {
    isAuthenticated: false,
  },
};

export const SessionProvider = ({ children }: ISessionProviderProps) => {
  const [sessionState, sessionDispatch] = useReducer(
    sessionReducer,
    sessionInitial
  );
  const sessionProviderValue = useMemo(
    () => ({
      sessionState,
      sessionDispatch,
    }),
    [sessionState, sessionDispatch]
  );

  useEffect(() => {
    const sessionStateStorage = JSON.parse(
      sessionStorage.getItem("sessionState") ?? "{}"
    );
    // if session state is stored in session storage
    // then update context state with session state
    if (sessionStateStorage.settings?.isAuthenticated) {
      sessionDispatch({
        payload: sessionStateStorage,
        type: SESSION_STATE_STORAGE,
      });
    }
  }, []);
  useEffect(() => {
    sessionStorage.setItem("sessionState", JSON.stringify(sessionState));
  }, [sessionState]);

  return (
    <SessionContext.Provider value={sessionProviderValue}>
      {children}
    </SessionContext.Provider>
  );
};
