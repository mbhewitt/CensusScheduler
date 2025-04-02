import {
  createContext,
  Dispatch,
  ReactNode,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import { DEVELOPER_MODE_STATE_STORAGE } from "@/constants";
import {
  developerModeReducer,
  IDeveloperModeAction,
  IDeveloperModeState,
} from "@/state/developer-mode/reducer";
import { formatDateTime } from "@/utils/formatDateTime";

interface IDeveloperModeProviderValue {
  developerModeState: IDeveloperModeState;
  developerModeDispatch: Dispatch<IDeveloperModeAction>;
}
interface IDeveloperModeProviderProps {
  children: ReactNode;
}

export const DeveloperModeContext = createContext(
  {} as IDeveloperModeProviderValue
);

const developerModeInitial: IDeveloperModeState = {
  accountType: {
    isEnabled: false,
    value: "",
  },
  dateTime: {
    isEnabled: false,
    value: formatDateTime(),
  },
  disableIdle: {
    isEnabled: false,
  },
};

export const DeveloperModeProvider = ({
  children,
}: IDeveloperModeProviderProps) => {
  // reducer
  // ------------------------------------------------------------
  const [developerModeState, developerModeDispatch] = useReducer(
    developerModeReducer,
    developerModeInitial
  );

  // other hooks
  // ------------------------------------------------------------
  const developerModeProviderValue = useMemo(
    () => ({ developerModeState, developerModeDispatch }),
    [developerModeState, developerModeDispatch]
  );

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    const developerModeStateStorage = JSON.parse(
      sessionStorage.getItem("developerModeState") ?? "{}"
    );

    // if developer mode state is stored in session storage
    // then update context state with developer mode state
    if (
      developerModeStateStorage.accountType?.isEnabled ||
      developerModeStateStorage.dateTime?.isEnabled ||
      developerModeStateStorage.disableIdle?.isEnabled
    ) {
      developerModeDispatch({
        payload: developerModeStateStorage,
        type: DEVELOPER_MODE_STATE_STORAGE,
      });
    }
  }, []);
  useEffect(() => {
    sessionStorage.setItem(
      "developerModeState",
      JSON.stringify(developerModeState)
    );
  }, [developerModeState]);

  // render
  // ------------------------------------------------------------
  return (
    <DeveloperModeContext.Provider value={developerModeProviderValue}>
      {children}
    </DeveloperModeContext.Provider>
  );
};
