"use client";

import {
  Email as EmailIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link as MuiLink,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { ReactNode, useState } from "react";

import { SnackbarText } from "@/components/general/SnackbarText";

// NEXT_PUBLIC_PIN_ENABLED is the on-playa signal (same convention as
// ShareButton / VolunteerInfo / Home). It's inlined at build time.
const isOnPlaya = process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

interface IOfflineLinkProps {
  // Absolute external URL (Hive, Discord, Burner Profile, Google Groups…).
  href: string;
  // Human label used both as the visible link text (unless children given)
  // and in the emailed subject/body so the volunteer knows what they asked
  // for.
  label: string;
  // Optional custom link content; defaults to `label`.
  children?: ReactNode;
  // Passed through to the off-playa <a> so callers keep their existing look
  // (e.g. the italic de-emphasized Burner Profile link, or an icon suffix).
  className?: string;
  style?: React.CSSProperties;
  // MUI sx for the on-playa button / off-playa MuiLink variants.
  sx?: object;
  // When true, render as an MUI <Link> off-playa (styled like the app's
  // link-cards) instead of a bare <a>. Off-playa only; on-playa is always a
  // button.
  asMuiLink?: boolean;
}

// OfflineLink (#643, folds in #630).
//
// Off-playa: renders a normal external link — behavior is identical to the
// plain <a> it replaces.
//
// On-playa (offline tablets): the destination is unreachable, so instead of a
// dead link we render a button that opens a dialog explaining the tablets have
// no internet and offers to email the link to the signed-in volunteer. On
// confirm we POST to /api/offline-link, which queues the mail for delivery
// when connectivity returns. If there's no email on file we say so and show
// the URL to type by hand.
export const OfflineLink = ({
  href,
  label,
  children,
  className,
  style,
  sx,
  asMuiLink,
}: IOfflineLinkProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // off-playa: plain external link, unchanged behavior
  if (!isOnPlaya) {
    if (asMuiLink) {
      return (
        <MuiLink
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          style={style}
          sx={sx}
        >
          {children ?? label}
          {!children && <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5 }} />}
        </MuiLink>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {children ?? label}
      </a>
    );
  }

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/offline-link", {
        method: "POST",
        body: JSON.stringify({ label, url: href }),
      });
      // Guard res.ok explicitly: a 401/403 write returns a JSON error body,
      // and silently treating that as success is the exact trap noted for
      // fetcherTrigger — so we branch on the status here.
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        enqueueSnackbar(
          <SnackbarText>
            {data?.message ?? "Couldn't send the email — please try again"}
          </SnackbarText>,
          { variant: "error" }
        );
        return;
      }
      if (data?.hasEmail === false) {
        enqueueSnackbar(
          <SnackbarText>
            We don&apos;t have an email on file for you. Type the address above
            to visit it later.
          </SnackbarText>,
          { variant: "warning" }
        );
        return;
      }
      enqueueSnackbar(
        <SnackbarText>
          Sent! We&apos;ll email you {label} when the tablets are back online.
        </SnackbarText>,
        { variant: "success" }
      );
      setIsDialogOpen(false);
    } catch {
      enqueueSnackbar(
        <SnackbarText>Couldn&apos;t send the email — please try again</SnackbarText>,
        { variant: "error" }
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <MuiLink
        component="button"
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className={className}
        style={style}
        sx={{
          alignItems: "center",
          display: "inline-flex",
          gap: 0.5,
          verticalAlign: "baseline",
          ...sx,
        }}
      >
        {children ?? label}
        <OpenInNewIcon fontSize="inherit" />
      </MuiLink>
      <Dialog
        fullWidth
        onClose={() => setIsDialogOpen(false)}
        open={isDialogOpen}
      >
        <DialogTitle>These tablets have no internet</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            The Census Lab tablets are offline on playa, so this link
            won&apos;t open here. We can email it to you so you can follow it
            once you&apos;re back online.
          </DialogContentText>
          <DialogContentText
            sx={{ wordBreak: "break-all", fontStyle: "italic" }}
          >
            {label}: {href}
          </DialogContentText>
          <Box sx={{ mt: 1 }}>
            <DialogContentText variant="body2">
              Prefer to type it in later? The address above is all you need.
            </DialogContentText>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            disabled={isSending}
            onClick={handleSend}
          >
            Email this link to me
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
