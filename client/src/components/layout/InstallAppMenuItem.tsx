"use client";

import { InstallMobile as InstallMobileIcon } from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useState } from "react";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

// "Install app" nav item. Shown whenever the app isn't already installed, so
// it's always discoverable (some users can't find the browser's own install
// button). Clicking replays the captured install prompt when the browser
// supports it; otherwise it shows short per-browser instructions.
export const InstallAppMenuItem = ({
  onNavigate,
}: {
  onNavigate?: () => void;
}) => {
  const { installed, isIos, canPrompt, promptInstall } = useInstallPrompt();
  const [hintOpen, setHintOpen] = useState(false);

  // Don't offer install inside the already-installed app.
  if (installed) return null;

  const handleClick = async () => {
    if (canPrompt) {
      await promptInstall();
      onNavigate?.();
    } else {
      setHintOpen(true);
    }
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={handleClick}>
          <ListItemIcon>
            <InstallMobileIcon />
          </ListItemIcon>
          <ListItemText primary="Install app" />
        </ListItemButton>
      </ListItem>

      <Dialog open={hintOpen} onClose={() => setHintOpen(false)}>
        <DialogTitle>Install Census</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {isIos ? (
              <>
                In <strong>Safari</strong>, tap the <strong>Share</strong>{" "}
                button, then <strong>Add to Home Screen</strong>.
              </>
            ) : (
              <>
                Open the browser menu (<strong>⋮</strong>) and choose{" "}
                <strong>Install app</strong> / <strong>Add to Home screen</strong>.
                If you don&apos;t see it, make sure you&apos;re on{" "}
                <strong>https://volunteers.census.burningman.org</strong>.
              </>
            )}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
};
