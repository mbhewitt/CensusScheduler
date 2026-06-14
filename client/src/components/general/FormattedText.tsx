import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

// Renders a plain-text description (shift_details / position_details /
// shift notes) with real paragraph spacing and bullet lists.
//
// These fields are stored as plain text with newlines. Rendered as a bare
// React child they collapse into one run-on block (whitespace folding), so
// this turns blank-line/newline breaks into spaced paragraphs and groups
// consecutive "- " / "• " lines into a proper bulleted list.
interface IFormattedTextProps {
  text: string;
}

export const FormattedText = ({ text }: IFormattedTextProps) => {
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <Box component="ul" key={key} sx={{ my: 0.5, pl: 3, "& li": { mb: 0.5 } }}>
        {bullets.map((bullet, index) => (
          <Typography component="li" key={index} variant="body2">
            {bullet}
          </Typography>
        ))}
      </Box>
    );
    bullets = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const bulletMatch = line.match(/^[-•]\s+(.*)$/);
    if (bulletMatch) {
      bullets.push(bulletMatch[1]);
      return;
    }
    flushBullets(`ul-${index}`);
    if (line) {
      blocks.push(
        <Typography key={index} sx={{ mb: 1 }} variant="body2">
          {line}
        </Typography>
      );
    }
  });
  flushBullets("ul-end");

  return <>{blocks}</>;
};
