"use client";

import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface IPasscodeRevealProps {
  shiftboardId: number;
}

// Render the volunteer's passcode embedded in the Census logo. Per Mew
// 2026-05-25: replace the "CENSUS" wordmark with the 4-digit passcode so
// it reads as a delight artifact rather than a plain text reveal.
//
// Coordinates below are tuned to logo-census.png (1019×1015 native).
// Mew 2026-05-25 iteration: leave the "C" of CENSUS visible (the badge
// reads as "C[4-digit code]"), so the mask starts after the "C" rather
// than at the start of the wordmark.
const LOGO_SRC = "/general/logo-census.png";
const PINK = "#EA008B";
const MASK_X = 305;
const MASK_Y = 460;
const MASK_W = 520;
const MASK_H = 130;
const DIGIT_FONT_PX = 180;

export const PasscodeReveal = ({ shiftboardId }: IPasscodeRevealProps) => {
  const [passcode, setPasscode] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleReveal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/volunteers/${shiftboardId}/account/passcode`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setPasscode(json.passcode ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch passcode");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHide = () => {
    setPasscode(null);
    setError(null);
  };

  useEffect(() => {
    if (passcode === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      // Overlay a pink rectangle that wipes the "CENSUS" wordmark.
      ctx.fillStyle = PINK;
      ctx.fillRect(MASK_X, MASK_Y, MASK_W, MASK_H);
      // Stamp the 4 digits in the same vertical band, chunky sans-serif
      // matching the logo's wordmark weight.
      ctx.fillStyle = "#000";
      ctx.font = `bold ${DIGIT_FONT_PX}px Arial Black, Impact, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const digits = (passcode || "----").split("");
      const slot = MASK_W / digits.length;
      digits.forEach((d, i) => {
        ctx.fillText(d, MASK_X + slot * (i + 0.5), MASK_Y + MASK_H / 2);
      });
    };
    img.src = LOGO_SRC;
  }, [passcode]);

  if (passcode === null) {
    return (
      <Stack alignItems="flex-end" spacing={1}>
        <Button
          disabled={isLoading}
          onClick={handleReveal}
          startIcon={<VisibilityIcon />}
          type="button"
          variant="outlined"
        >
          {isLoading ? "Loading…" : "Reveal passcode"}
        </Button>
        {error && (
          <Typography color="error" variant="caption">
            {error}
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Stack alignItems="center" spacing={1}>
      <canvas
        ref={canvasRef}
        style={{
          width: 260,
          height: 260,
          maxWidth: "100%",
        }}
      />
      <Button
        onClick={handleHide}
        startIcon={<VisibilityOffIcon />}
        size="small"
        type="button"
        variant="text"
      >
        Hide
      </Button>
    </Stack>
  );
};
