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
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

// Super-admin page (AuthGate) to onboard a tablet. Mints a single-use,
// short-TTL provisioning token via /api/provision/token, renders it as a QR of
// `${origin}/provision#${token}`, and the tablet scans it to become a trusted
// device. Show one QR per tablet; regenerate for the next.
interface MintResponse {
  token: string;
  expiresAt: string;
  ttlMs: number;
}

export const ProvisionTablet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

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
    if (!expiresAt) return;
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
      <Card sx={{ maxWidth: 520, mx: "auto" }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Provision a tablet</Typography>
            <Typography color="text.secondary" variant="body2">
              Generate a code and scan it with the tablet&apos;s camera. Opening
              the link on the tablet marks it as a trusted device that may use
              passcode sign-in. Codes are single-use and expire quickly — one
              per tablet.
            </Typography>

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
    </Container>
  );
};
