"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

// Super-admin page (AuthGate) to onboard trusted devices for passcode sign-in.
// Two paths:
//   1. THIS device — one click, no camera. For the machine the super-admin is
//      sitting at (HQ desktop/laptop): /api/provision/self sets the cookie
//      directly. /api/provision/deprovision clears it.
//   2. ANOTHER device (a tablet) — mint a single-use QR via /api/provision/token
//      of `${origin}/provision#${token}`; the tablet scans it to become trusted.
interface MintResponse {
  token: string;
  expiresAt: string;
  ttlMs: number;
}

export const ProvisionTablet = () => {
  // this-device status + actions
  const [thisProvisioned, setThisProvisioned] = useState<boolean | null>(null);
  const [thisBusy, setThisBusy] = useState(false);
  const [thisError, setThisError] = useState("");

  // QR (other device) state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // The peers-device cookie is httpOnly, so ask the server whether THIS browser
  // is currently a trusted device.
  const refreshThisStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/device", {
        credentials: "same-origin",
      });
      const data = await res.json();
      setThisProvisioned(Boolean(data?.provisioned));
    } catch {
      setThisProvisioned(false);
    }
  }, []);

  useEffect(() => {
    refreshThisStatus();
  }, [refreshThisStatus]);

  const provisionThis = useCallback(async () => {
    setThisBusy(true);
    setThisError("");
    try {
      const res = await fetch("/api/provision/self", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? `Failed (${res.status})`);
      }
      await refreshThisStatus();
    } catch (err) {
      setThisError(
        err instanceof Error ? err.message : "Could not provision this device."
      );
    } finally {
      setThisBusy(false);
    }
  }, [refreshThisStatus]);

  const deprovisionThis = useCallback(async () => {
    setThisBusy(true);
    setThisError("");
    try {
      const res = await fetch("/api/provision/deprovision", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? `Failed (${res.status})`);
      }
      await refreshThisStatus();
    } catch (err) {
      setThisError(
        err instanceof Error
          ? err.message
          : "Could not deprovision this device."
      );
    } finally {
      setThisBusy(false);
    }
  }, [refreshThisStatus]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    setQrDataUrl("");
    try {
      const res = await fetch("/api/provision/token", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? `Failed (${res.status})`);
      }
      const data: MintResponse = await res.json();
      const url = `${window.location.origin}/provision#${data.token}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      setQrDataUrl(dataUrl);
      setExpiresAt(new Date(data.expiresAt).getTime());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate a code."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Tick the countdown; when it hits zero the QR is dead (token expired).
  useEffect(() => {
    if (!expiresAt) return undefined;
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = expiresAt !== null && secondsLeft === 0;
  const mmss = `${Math.floor(secondsLeft / 60)}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3} sx={{ maxWidth: 520, mx: "auto" }}>
        {/* This device — one click, no camera */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">This device</Typography>
              <Typography color="text.secondary" variant="body2">
                Provision the machine you&apos;re using right now (e.g. the HQ
                desktop or laptop) so it can use passcode sign-in — no camera
                needed.
              </Typography>

              {thisError && <Alert severity="error">{thisError}</Alert>}

              {thisProvisioned === null ? (
                <Stack alignItems="center" sx={{ py: 1 }}>
                  <CircularProgress size={22} />
                </Stack>
              ) : (
                <>
                  <Alert severity={thisProvisioned ? "success" : "info"}>
                    {thisProvisioned
                      ? "This device is provisioned — passcode sign-in is available here."
                      : "This device is not provisioned — passcode sign-in is hidden here."}
                  </Alert>

                  {thisProvisioned ? (
                    <Button
                      color="error"
                      disabled={thisBusy}
                      onClick={deprovisionThis}
                      startIcon={
                        thisBusy ? <CircularProgress size={18} /> : undefined
                      }
                      variant="outlined"
                    >
                      Deprovision this device
                    </Button>
                  ) : (
                    <Button
                      disabled={thisBusy}
                      onClick={provisionThis}
                      startIcon={
                        thisBusy ? <CircularProgress size={18} /> : undefined
                      }
                      variant="contained"
                    >
                      Provision this device
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Another device (tablet) — QR flow */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Provision a tablet</Typography>
              <Typography color="text.secondary" variant="body2">
                For a separate tablet: generate a code and scan it with the
                tablet&apos;s camera. Opening the link on the tablet marks it as
                a trusted device that may use passcode sign-in. Codes are
                single-use and expire quickly — one per tablet.
              </Typography>

              <Divider />

              {error && <Alert severity="error">{error}</Alert>}

              {qrDataUrl && !expired && (
                <Stack alignItems="center" spacing={1}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Provisioning QR code"
                    src={qrDataUrl}
                    width={320}
                    height={320}
                  />
                  <Typography color="text.secondary" variant="body2">
                    Expires in {mmss}
                  </Typography>
                </Stack>
              )}

              {expired && (
                <Alert severity="warning">
                  This code expired. Generate a new one for the next tablet.
                </Alert>
              )}

              <Button
                disabled={loading}
                onClick={generate}
                startIcon={loading ? <CircularProgress size={18} /> : undefined}
                variant="contained"
              >
                {qrDataUrl ? "Generate new code" : "Generate code"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};
