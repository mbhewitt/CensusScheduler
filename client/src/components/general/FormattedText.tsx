import { Box, Divider, Typography } from "@mui/material";
import { Fragment, type ReactNode } from "react";

// Renders a plain-text description (shift_details / position_details /
// shift notes) with real paragraph spacing, bullet lists, inline **bold**,
// and horizontal dividers.
//
// These fields are stored as plain text with newlines. Rendered as a bare
// React child they collapse into one run-on block (whitespace folding), so
// this turns blank-line/newline breaks into spaced paragraphs, groups
// consecutive "- " / "• " lines into a bulleted list, renders a line of only
// dashes/asterisks/underscores ("---") as a divider, and turns **text** into
// bold. Authors can put a "---" line between two notes to separate them.
interface IFormattedTextProps {
  text: string;
}

// Turn inline **bold** markers into <strong>. Simple, non-nested.
const renderInline = (text: string): ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    return bold ? (
      <strong key={index}>{bold[1]}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    );
  });
};

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
            {renderInline(bullet)}
          </Typography>
        ))}
      </Box>
    );
    bullets = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    // horizontal rule: a line of only --- / *** / ___ (3+) becomes a divider,
    // e.g. to separate two distinct notes stored in one field.
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushBullets(`ul-${index}`);
      blocks.push(<Divider key={index} sx={{ my: 1.5 }} />);
      return;
    }
    const bulletMatch = line.match(/^[-•]\s+(.*)$/);
    if (bulletMatch) {
      bullets.push(bulletMatch[1]);
      return;
    }
    flushBullets(`ul-${index}`);
    if (line) {
      blocks.push(
        <Typography key={index} sx={{ mb: 1 }} variant="body2">
          {renderInline(line)}
        </Typography>
      );
    }
  });
  flushBullets("ul-end");

  return <>{blocks}</>;
};
