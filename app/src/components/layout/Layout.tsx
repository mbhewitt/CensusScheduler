import { ReactNode, useContext } from "react";

import { EasterEgg } from "src/components/general/EasterEgg";
import { DeveloperCard } from "src/components/layout/developer-card";
import { Footer } from "src/components/layout/Footer";
import { Header } from "src/components/layout/Header";
import { DeveloperModeContext } from "src/state/developer-mode/context";
import { EasterEggContext } from "src/state/easter-egg/context";

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
  const { isEasterEggOpen } = useContext(EasterEggContext);

  // display
  // --------------------
  return (
    <>
      {isEasterEggOpen ? (
        <EasterEgg />
      ) : (
        <>
          <Header />
          {children}
          <Footer />
          {(isAccountTypeEnabled || isDateTimeEnabled) && <DeveloperCard />}
        </>
      )}
    </>
  );
};
