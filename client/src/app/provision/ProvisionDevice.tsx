"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

// Tablet landing page for QR provisioning. The super-admin's QR encodes
// `${origin}/provision#${token}`; the tablet opens it here, we read the token
// from the URL fragment (kept out of server logs) and POST it to
// /api/provision/claim, which sets the trusted census-device cookie. On success
// this tablet may use passcode sign-in and should install the app.
type Status = "claiming" | "success" | "error";

export const ProvisionDevice = () => {
  const [status, setStatus] = useState<Status>("claiming");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = window.location.hash.replace(/^#/, "");
    if (!token) {
      setStatus("error");
      setMessage("No provisioning code found in this link. Re-scan the QR code.");
      return;
    }
    let cancelled = false;
    fetch("/api/provision/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          setStatus("success");
          // Drop the token from the URL/history once consumed.
          window.history.replaceState(null, "", "/provision");
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus("error");
          setMessage(data?.message ?? "Provisioning failed. Ask an admin for a new QR code.");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage("Network error. Make sure the tablet is online and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Card sx={{ maxWidth: 480, mx: "auto" }}>
        <CardContent>
          {status === "claiming" && (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography>Provisioning this tablet…</Typography>
            </Stack>
          )}

          {status === "success" && (
            <Stack spacing={2}>
              <Alert severity="success">This tablet is provisioned. ✅</Alert>
              <Typography variant="h6">Next steps</Typography>
              <Typography>
                1. Install the app: open your browser menu and choose{" "}
                <strong>Install</strong> / <strong>Add to Home Screen</strong>.
              </Typography>
              <Typography>
                2. Open the installed app and sign in with a passcode.
              </Typography>
              <Button component={Link} href="/sign-in" variant="contained">
                Go to sign-in
              </Button>
            </Stack>
          )}

          {status === "error" && (
            <Stack spacing={2}>
              <Alert severity="error">{message}</Alert>
              <Typography color="text.secondary" variant="body2">
                Provisioning codes are single-use and expire quickly. Ask a
                super-admin to generate a fresh QR code and scan it again.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};
