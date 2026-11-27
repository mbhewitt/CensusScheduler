"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// #449: pages (re)load scrolled mid-document after navigation, because the
// short loading view swaps for the long page and the old scroll offset sticks.
// On a forward navigation, jump to the top; on back/forward (popstate) leave
// the browser's own scroll restoration alone so "back" keeps your place.
export const ScrollToTop = () => {
  const pathname = usePathname();
  const isPopRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (isPopRef.current) {
      isPopRef.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
