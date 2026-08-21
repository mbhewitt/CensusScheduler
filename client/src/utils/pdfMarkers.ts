import { PDFPage, rgb } from "pdf-lib";

// Amber school-bus marker used on printed rosters/labels to flag a volunteer
// who still needs a role-specific training. Drawn as vector art rather than a
// glyph because the print pipeline only embeds ZapfDingbats (no bus dingbat)
// and PDF standard fonts can't render color emoji.
export const BUS_AMBER = rgb(0.92, 0.6, 0);

// Draws a tiny bus of overall height `h`, left edge at `x`, resting on baseline
// `y` (wheels dip just below it, like a text descender). Returns the width
// consumed so callers can advance their cursor past it.
export const drawBusMarker = (
  page: PDFPage,
  x: number,
  y: number,
  h: number,
  color = BUS_AMBER
): number => {
  const w = h * 1.7;
  const black = rgb(0.15, 0.15, 0.15);
  const white = rgb(1, 1, 1);
  const bodyH = h * 0.62;
  const by = y + h * 0.12; // body bottom, leaving room for wheels below
  page.drawRectangle({ x, y: by, width: w, height: bodyH, color, borderColor: black, borderWidth: 0.4 });
  // three windows along the upper body
  const winH = bodyH * 0.34;
  const winY = by + bodyH * 0.5;
  const winW = w * 0.16;
  const gap = w * 0.07;
  let wx = x + gap;
  for (let i = 0; i < 3; i++) {
    page.drawRectangle({ x: wx, y: winY, width: winW, height: winH, color: white });
    wx += winW + gap * 0.7;
  }
  // front door
  page.drawRectangle({
    x: x + w - w * 0.16 - gap * 0.5,
    y: by + bodyH * 0.12,
    width: w * 0.16,
    height: bodyH * 0.72,
    color: white,
    borderColor: black,
    borderWidth: 0.3,
  });
  // wheels
  const r = h * 0.15;
  page.drawCircle({ x: x + w * 0.26, y: by, size: r, color: black });
  page.drawCircle({ x: x + w * 0.76, y: by, size: r, color: black });
  return w + 1;
};
