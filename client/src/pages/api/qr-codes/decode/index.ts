import { promises as fs } from "node:fs";

import formidable from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { decodeQr, payloadToSettings } from "lib/qr";

// formidable streams the multipart body itself, so disable Next's JSON parser.
export const config = { api: { bodyParser: false } };

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// POST /api/qr-codes/decode (multipart, field "file"): decode an uploaded QR
// image and return { payload, qrType, settings } so the editor can round-trip
// an existing QR for editing/re-saving. Does NOT store anything.
const decode = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  const form = formidable({ maxFileSize: MAX_UPLOAD_BYTES, keepExtensions: true });
  let filepath: string | undefined;
  try {
    const [, files] = await form.parse(req);
    const uploaded = files.file?.[0];
    if (!uploaded) {
      return res.status(400).json({ statusCode: 400, message: "No `file` provided" });
    }
    filepath = uploaded.filepath;
    const buf = await fs.readFile(filepath);

    let payload: string | null;
    try {
      payload = await decodeQr(buf);
    } catch {
      return res.status(400).json({ statusCode: 400, message: "Could not read image" });
    }
    if (!payload) {
      return res.status(422).json({ statusCode: 422, message: "No QR code found in image" });
    }

    const { type, settings } = payloadToSettings(payload);
    return res.status(200).json({ statusCode: 200, payload, qrType: type, settings });
  } catch (err) {
    const message =
      err instanceof Error && /maxFileSize/.test(err.message) ? "File too large" : "Upload failed";
    return res.status(400).json({ statusCode: 400, message });
  } finally {
    if (filepath) await fs.unlink(filepath).catch(() => {});
  }
};

export default withSuperAdmin(decode);
