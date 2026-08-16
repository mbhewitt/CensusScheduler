import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { renderPng, renderSvg, SIZE_PRESETS } from "lib/qr";
import { getQrById } from "lib/qrDb";

// GET /api/qr-codes/[qrId]/download?format=png&size=flyer
//     format = png | svg ; size = one of SIZE_PRESETS (png only).
// Regenerates the QR from the stored payload+settings and streams it as the
// download named by the row's filename. Pure read — safe to link to.
const download = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  const qrId = Number(req.query.qrId);
  if (!Number.isFinite(qrId)) {
    return res.status(400).json({ statusCode: 400, message: "Bad qrId" });
  }
  const row = await getQrById(qrId);
  if (!row) {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }

  const format = String(req.query.format ?? "png").toLowerCase();
  const safeName = row.filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (format === "svg") {
    const svg = await renderSvg(row.payload, row.settings);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.svg"`);
    return res.send(svg);
  }

  const sizeKey = String(req.query.size ?? "web");
  const preset = SIZE_PRESETS[sizeKey] ?? SIZE_PRESETS.web;
  const png = await renderPng(row.payload, row.settings, preset.px);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.png"`);
  return res.send(png);
};

export default withSuperAdmin(download);
