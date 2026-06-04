"use client";

import { useContext, useEffect } from "react";

import { SESSION_SIGN_OUT } from "@/constants";
import { SessionContext } from "@/state/session/context";

// Detect a stale client-side session: SessionContext / localStorage says
// the user is authenticated, but the actual HMAC-signed cookie has
// expired or been cleared. Without this, the UI keeps rendering the
// authenticated branch (e.g. Home's "Welcome — view your account"
// button) and the user gets stuck in a spinner when they click anything
// that needs the cookie.
//
// Approach: on mount, when client state claims authenticated, fire one
// quiet GET to /api/auth/session. If 401, silently sign out client-side
// (no snackbar, no redirect) so the next render picks the unauth UI
// branch. If 200 / network error, do nothing — false positives here
// would log healthy users out.
//
// One-shot per mount; not a heartbeat. The bug only manifests when
// state is already stale at first render, and a heartbeat opens up
// false-positive risk (transient API errors logging users out).
//
// See issue #389.
export const useSessionValidation = () => {
  const {
    sessionDispatch,
    sessionState: {
      settings: { isAuthenticated },
    },
  } = useContext(SessionContext);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401) {
          sessionDispatch({ type: SESSION_SIGN_OUT });
        }
      })
      .catch(() => {
        // Network errors: leave client state alone. Better to keep a
        // healthy user signed in than to bounce them on a transient
        // blip.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, sessionDispatch]);
};
