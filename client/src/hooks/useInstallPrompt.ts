"use client";

import { useEffect, useState } from "react";

// Captures the browser's PWA-install affordance so we can offer an in-app
// "Install app" menu item (some users can't find the browser's own install
// button). Chrome/Android fires `beforeinstallprompt`, which we stash and
// replay on click. iOS Safari has no programmatic install, so there we fall
// back to showing "Share → Add to Home Screen" instructions.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallState {
  installed: boolean; // already running as an installed PWA
  isIos: boolean; // iOS Safari (manual Add-to-Home-Screen only)
  canPrompt: boolean; // a captured beforeinstallprompt is ready to replay
  promptInstall: () => Promise<void>;
}

export const useInstallPrompt = (): InstallState => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const nav = window.navigator as unknown as { standalone?: boolean };
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      nav.standalone === true;
    setInstalled(Boolean(standalone));
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !nav.standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault(); // keep the mini-infobar from showing; we replay it
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null); // a prompt can only be used once
  };

  return { installed, isIos, canPrompt: Boolean(deferred), promptInstall };
};
