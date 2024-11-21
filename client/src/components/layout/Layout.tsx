import { ReactNode, useContext } from "react";

import { DeveloperCard } from "@/components/layout/developer-card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { DeveloperModeContext } from "@/state/developer-mode/context";

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
