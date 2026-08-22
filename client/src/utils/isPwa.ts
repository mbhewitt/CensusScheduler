// True when the app is running as an installed PWA (standalone window) rather
// than in a normal browser tab. Used at sign-in to decide whether to request a
// long-lived session — see /api/auth/okta and lib/session.ts.
export const isPwaStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari doesn't support display-mode; it exposes navigator.standalone
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};
