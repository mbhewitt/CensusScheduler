"use client";

import { CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef } from "react";

import { SessionContext } from "@/state/session/context";

// Return link volunteers click from the END of the Census welcome course on
// the Burning Man Hive. Marks the "welcome" checklist item complete for the
// signed-in volunteer, then drops them back on their info/checklist page.
// If not signed in, bounce through sign-in with returnTo so they come back
// here after authenticating. (#483)
const WelcomeCompletePage = () => {
  // context
  // ------------------------------------------------------------
  const {
    sessionState: {
      settings: { isAuthenticated },
      user: { shiftboardId },
    },
  } = useContext(SessionContext);

  // other hooks
  // ------------------------------------------------------------
  const router = useRouter();
  const hasProcessed = useRef(false);

  // side effects
  // ------------------------------------------------------------
  useEffect(() => {
    // SessionProvider hydrates isAuthenticated from sessionStorage in its own
    // effect. Wait for that: only redirect to sign-in once we know for sure
    // there's no session (isAuthenticated stays false and shiftboardId 0).
    if (hasProcessed.current) return;

    if (!isAuthenticated || !shiftboardId) {
      // Give hydration a tick; if still unauthenticated, send to sign-in.
      const timer = setTimeout(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;
        router.replace("/sign-in?returnTo=/welcome-complete");
      }, 300);
      return () => clearTimeout(timer);
    }

    hasProcessed.current = true;
    const infoPath = `/volunteers/${shiftboardId}/info`;
    fetch(`/api/volunteers/${shiftboardId}/info/welcome-complete`, {
      method: "POST",
      body: JSON.stringify({ complete: true }),
    })
      .catch(() => {
        // Non-fatal: the volunteer can still self-check on the checklist.
      })
      .finally(() => {
        router.replace(infoPath);
      });
  }, [isAuthenticated, shiftboardId, router]);

  // render
  // ------------------------------------------------------------
  return (
    <Container
      component="main"
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        pt: 6,
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress color="secondary" />
        <Typography color="text.secondary">
          Marking your welcome step complete&hellip;
        </Typography>
      </Stack>
    </Container>
  );
};

export default WelcomeCompletePage;
