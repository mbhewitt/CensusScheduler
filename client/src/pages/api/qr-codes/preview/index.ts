import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { buildPayload, renderPng, type QrSettings, type QrType } from "lib/qr";

// POST /api/qr-codes/preview  body { qrType, settings }
// Renders the current (unsaved) design to a small PNG data URI for live preview
// in the editor. qrcode/sharp are server-only, so preview must round-trip here.
const preview = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  let body: { qrType?: QrType; settings?: QrSettings };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ statusCode: 400, message: "Bad JSON" });
  }
  if (!body.qrType || !body.settings) {
    return res.status(400).json({ statusCode: 400, message: "Missing qrType/settings" });
  }
  try {
    const payload = buildPayload(body.qrType, body.settings);
    const png = await renderPng(payload, body.settings, 400);
    return res.status(200).json({
      statusCode: 200,
      dataUri: `data:image/png;base64,${png.toString("base64")}`,
      payload,
    });
  } catch (err) {
    return res.status(400).json({
      statusCode: 400,
      message: err instanceof Error ? err.message : "Could not render preview",
    });
  }
};

export default withSuperAdmin(preview);
