import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useMemo,
  useState,
} from "react";

interface IEasterEggProviderValue {
  isEasterEggOpen: boolean;
  setIsEasterEggOpen: Dispatch<SetStateAction<boolean>>;
}
interface IEasterEggProviderProps {
  children: ReactNode;
}

export const EasterEggContext = createContext({} as IEasterEggProviderValue);

export const EasterEggProvider = ({ children }: IEasterEggProviderProps) => {
  // state
  // --------------------
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);

  // other hooks
  // --------------------
  const easterEggProviderValue = useMemo(
    () => ({ isEasterEggOpen, setIsEasterEggOpen }),
    [isEasterEggOpen, setIsEasterEggOpen]
  );

  // display
  // --------------------
  return (
    <EasterEggContext.Provider value={easterEggProviderValue}>
      {children}
    </EasterEggContext.Provider>
  );
};
