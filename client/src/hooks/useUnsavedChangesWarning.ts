import { useEffect } from "react";

// Warn before losing unsaved form edits (#107): full unload/refresh/close via
// `beforeunload`, and in-app navigation via a capture-phase click listener on
// internal links (App Router navigation never fires `beforeunload`).
// Browser back/forward is covered only by the unload prompt, not here.
export const useUnsavedChangesWarning = (isDirty: boolean) => {
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (
        !a ||
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        a.origin !== window.location.origin ||
        (a.pathname === window.location.pathname &&
          a.search === window.location.search)
      ) {
        return;
      }
      if (
        !window.confirm(
          "You have unsaved changes. Leave this page and lose them?"
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [isDirty]);
};
