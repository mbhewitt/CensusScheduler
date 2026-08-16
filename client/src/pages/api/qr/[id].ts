import type { NextApiRequest, NextApiResponse } from "next";

import { renderPng, SIZE_PRESETS } from "lib/qr";
import { getQrById } from "lib/qrDb";

// GET /api/qr/[id].png — PUBLIC (no auth) perm-link to the web-size PNG of a QR
// by id, so it can be embedded anywhere. Allowlisted in middleware.ts.
const qrImage = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  const id = Number(String(req.query.id ?? "").replace(/\.png$/, ""));
  if (!Number.isFinite(id)) {
    return res.status(400).json({ statusCode: 400, message: "Bad id" });
  }
  const row = await getQrById(id);
  if (!row) {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
  const png = await renderPng(row.payload, row.settings, SIZE_PRESETS.web.px);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.send(png);
};

export default qrImage;
