"use client";

import { Share as ShareIcon } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useSnackbar } from "notistack";

import { SnackbarText } from "@/components/general/SnackbarText";
import { useIsOnPlaya } from "@/hooks/useIsOnPlaya";

interface IShareButtonProps {
  title: string;
  text: string;
  // Relative path (e.g. "/shifts/123/volunteers"); resolved to an absolute URL
  // at click time so it's SSR-safe and always carries the current origin.
  path: string;
  label?: string;
  // Defaults preserve existing call sites; the shift page passes
  // variant="text" + color="inherit" + size="small" so Share reads as a quiet
  // secondary action beneath the filled "Add this shift" button.
  variant?: "contained" | "outlined" | "text";
  color?: "inherit" | "primary" | "secondary";
  size?: "small" | "medium" | "large";
}

export const ShareButton = ({
  title,
  text,
  path,
  label = "Share",
  variant = "contained",
  color = "primary",
  size = "medium",
}: IShareButtonProps) => {
  const { enqueueSnackbar } = useSnackbar();

  // Sharing is pointless/broken on the offline tablets. Hide on a provisioned
  // tablet too (build flag is "false" on the prod origin), and while the device
  // check is in flight, so it never flashes on a tablet (Chipper 2026-09-05).
  const onPlaya = useIsOnPlaya();
  if (onPlaya !== false) return null;

  const handleShare = async () => {
    const url = new URL(path, window.location.origin).href;

    // Prefer the native share sheet (mobile); fall back to copy-link where the
    // Web Share API isn't available (most desktop browsers).
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User dismissed the share sheet (AbortError) or it failed — no-op.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      enqueueSnackbar(
        <SnackbarText>Link copied to clipboard</SnackbarText>,
        { variant: "success" }
      );
    } catch {
      enqueueSnackbar(
        <SnackbarText>Couldn&apos;t copy the link — copy it from your browser bar</SnackbarText>,
        { variant: "error" }
      );
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      startIcon={<ShareIcon />}
      onClick={handleShare}
    >
      {label}
    </Button>
  );
};
