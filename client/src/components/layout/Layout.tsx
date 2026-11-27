import { ReactNode, useContext, useEffect } from "react";

import { DeveloperCard } from "@/components/layout/developer-card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReadOnlyBanner } from "@/components/layout/ReadOnlyBanner";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import { DeveloperModeContext } from "@/state/developer-mode/context";
import { SessionContext } from "@/state/session/context";
import { checkIsAdmin } from "@/utils/checkIsRoleExist";
import { errorDetail } from "@/utils/fetcher";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: ILayoutProps) => {
  // context
  // ------------------------------------------------------------
  const {
    developerModeState: {
      accountType,
      accountType: { isEnabled: isAccountTypeEnabled },
      dateTime: { isEnabled: isDateTimeEnabled },
    },
  } = useContext(DeveloperModeContext);

  const {
    sessionState: {
      user: { roleList },
    },
  } = useContext(SessionContext);
  // admins see the raw error text in error toasts (#105)
  useEffect(() => {
    errorDetail.show = Boolean(checkIsAdmin(accountType, roleList));
  }, [accountType, roleList]);

  // One-shot stale-session detector — runs once per app mount, clears
  // client state if the cookie has expired (issue #389).
  useSessionValidation();

  // render
  // ------------------------------------------------------------
  return (
    <>
      <Header />
      <ReadOnlyBanner />
      {children}
      <Footer />
      {(isAccountTypeEnabled || isDateTimeEnabled) && <DeveloperCard />}
    </>
  );
};
