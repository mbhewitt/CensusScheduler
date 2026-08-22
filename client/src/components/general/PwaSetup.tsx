"use client";

import { useEffect } from "react";

// Registers the service worker and injects the PWA head tags. Rendered from the
// (client) root layout; React 19 hoists the <link>/<meta> tags into <head>.
// The service worker is what makes the app installable — see public/sw.js.
export const PwaSetup = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // registration failures shouldn't break the app (e.g. http dev hosts)
      });
    }
  }, []);

  return (
    <>
      <link rel="manifest" href="/manifest.webmanifest" />
      <meta name="theme-color" content="#ea008b" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Census" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
    </>
  );
};
