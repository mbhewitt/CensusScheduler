import {
  createContext,
  Dispatch,
  ReactNode,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import { SESSION_STATE_STORAGE } from "@/constants";
import {
  ISessionAction,
  ISessionState,
  sessionReducer,
} from "@/state/session/reducer";

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
    isCreated: false,
    location: "",
    notes: "",
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
  // reducer
  // ------------------------------------------------------------
  const [sessionState, sessionDispatch] = useReducer(
    sessionReducer,
    sessionInitial
  );

  // other hooks
  // ------------------------------------------------------------
  const sessionProviderValue = useMemo(
    () => ({
      sessionState,
      sessionDispatch,
    }),
    [sessionState, sessionDispatch]
  );

  // side effects
  // ------------------------------------------------------------
  // Persist auth state in localStorage, NOT sessionStorage: sessionStorage is
  // wiped when the tab / installed PWA is fully closed, so a returning user
  // (esp. an installed PWA reopen) landed logged-out even though their signed
  // census-session cookie was still valid — the cookie persisted but the UI
  // state didn't. localStorage survives close/reopen; useSessionValidation
  // (mounted in Layout) reconciles it against the cookie on mount and signs out
  // if the cookie has expired (401), so the cookie stays the security boundary
  // — a 5-min passcode session still clears on reopen after it lapses.
  useEffect(() => {
    // Guarded: corrupt localStorage or disabled storage (Safari private mode)
    // must not crash the provider on mount — just come up unauthenticated.
    let sessionStateStorage: ISessionState = sessionInitial;
    try {
      sessionStateStorage = JSON.parse(
        localStorage.getItem("sessionState") ?? "{}"
      );
    } catch {
      /* unreadable storage — treat as no persisted session */
    }
    // if session state was persisted then rehydrate context from it
    if (sessionStateStorage.settings?.isAuthenticated) {
      sessionDispatch({
        payload: sessionStateStorage,
        type: SESSION_STATE_STORAGE,
      });
    }
  }, []);
  useEffect(() => {
    // Guarded: setItem throws in Safari private mode / when storage is disabled,
    // and this runs on every session change — an unguarded throw would break the
    // app. Persistence is best-effort; the cookie is the source of truth.
    try {
      localStorage.setItem("sessionState", JSON.stringify(sessionState));
    } catch {
      /* storage unavailable — skip persistence, session still works this tab */
    }
  }, [sessionState]);

  // render
  // ------------------------------------------------------------
  return (
    <SessionContext.Provider value={sessionProviderValue}>
      {children}
    </SessionContext.Provider>
  );
};
