import { ReactNode, useContext } from "react";

import { DeveloperCard } from "src/components/layout/developer-card";
import { Footer } from "src/components/layout/Footer";
import { Header } from "src/components/layout/Header";
import { DeveloperModeContext } from "src/state/developer-mode/context";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: ILayoutProps) => {
  // context
  // --------------------
  const {
    developerModeState: {
      accountType: { isEnabled: isAccountTypeEnabled },
      dateTime: { isEnabled: isDateTimeEnabled },
    },
  } = useContext(DeveloperModeContext);

  // render
  // --------------------
  return (
    <>
      <Header />
      {children}
      <Footer />
      {(isAccountTypeEnabled || isDateTimeEnabled) && <DeveloperCard />}
    </>
  );
};
