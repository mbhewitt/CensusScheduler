import {
  Close as CloseIcon,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { useState } from "react";

import type { IHelpPage } from "@/components/help/helpContent";

interface IHelpButtonProps {
  help: IHelpPage;
  sx?: SxProps<Theme>;
}

// "?" in a page's or pop-up's top-right corner: opens a pop-up naming and
// explaining every section, field, link and button on it (Chipper, #814).
export const HelpButton = ({ help, sx }: IHelpButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton
        aria-label={`Help: ${help.title}`}
        onClick={() => setIsOpen(true)}
        sx={sx}
      >
        <HelpOutlineIcon />
      </IconButton>
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setIsOpen(false)}
        open={isOpen}
        scroll="paper"
      >
        <DialogTitle sx={{ pr: 6 }}>Help: {help.title}</DialogTitle>
        <IconButton
          aria-label="Close help"
          onClick={() => setIsOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          {help.sections.map(({ heading, intro, items }) => (
            <Box component="section" key={heading} sx={{ mb: 3 }}>
              <Typography component="h3" sx={{ mb: 1 }} variant="h6">
                {heading}
              </Typography>
              {intro && <Typography sx={{ mb: 1 }}>{intro}</Typography>}
              {items.map(({ name, text }) => (
                <Typography key={name} sx={{ mb: 1 }}>
                  <strong>{name}</strong>: {text}
                </Typography>
              ))}
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
};
