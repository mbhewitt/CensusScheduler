import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { isAdmin } from "@/lib/authz";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";

// Shift-notes photo (per Mew + Chipper 2026-08-29): a shift lead photographs
// their paper roster notes; we read the handwriting with a vision model and
// match each row to a volunteer on the shift, then (after the lead confirms)
// save the notes. Purely additive — does not touch check-in/review/roster.
//
//   POST ?action=parse  { imageBase64, mediaType } -> { entries: [...] } (no write)
//   POST ?action=save   { entries: [{ shiftboardId, timePositionId, note }] } -> saves
//
// Admin-only (same trust level as writing reviews). Inactive with a friendly 503
// until ANTHROPIC_API_KEY is set — so shipping it never breaks anything.

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const VISION_MODEL = process.env.NOTES_PHOTO_MODEL ?? "claude-sonnet-4-6";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // ~8MB decoded cap

interface RosterRow extends RowDataPacket {
  shiftboard_id: number;
  time_position_id: number;
  playa_name: string | null;
  world_name: string | null;
  position: string | null;
}

interface ParsedEntry {
  name: string;
  note: string;
  matchedShiftboardId: number | null;
  timePositionId: number | null;
  confidence: "high" | "medium" | "low";
}

async function loadRoster(timeId: string | string[] | undefined) {
  const [rows] = await pool.query<RosterRow[]>(
    `SELECT vs.shiftboard_id, vs.time_position_id,
            v.playa_name, v.world_name,
            COALESCE(NULLIF(stp.position_alias, ''), pt.position) AS position
       FROM op_volunteer_shifts vs
       JOIN op_shift_time_position stp
         ON stp.time_position_id = vs.time_position_id AND stp.remove_time_position = false
       JOIN op_position_type pt ON pt.position_type_id = stp.position_type_id
       JOIN op_volunteers v ON v.shiftboard_id = vs.shiftboard_id
      WHERE stp.shift_times_id = ? AND vs.remove_shift = false AND vs.shiftboard_id > 0`,
    [timeId]
  );
  return rows;
}

// Ask the vision model to read the photo and match rows to the roster we pass in.
async function readNotesFromPhoto(
  imageBase64: string,
  mediaType: string,
  roster: RosterRow[]
): Promise<ParsedEntry[]> {
  const rosterText = roster
    .map(
      (r) =>
        `- shiftboardId ${r.shiftboard_id}: ${r.playa_name ?? ""} "${r.world_name ?? ""}"${r.position ? ` (${r.position})` : ""}`
    )
    .join("\n");

  const prompt = `This is a photo of a paper shift roster with handwritten notes next to volunteer names.

Here are the volunteers on this shift:
${rosterText}

For each row you can read, extract the volunteer's name and the handwritten note next to it. Match each to a volunteer above using their shiftboardId. If a name doesn't clearly match anyone above, set matchedShiftboardId to null. Skip rows with no note.

Respond with ONLY a JSON array, no prose:
[{"name": "<as written>", "note": "<the handwritten note, cleaned up>", "matchedShiftboardId": <number|null>, "confidence": "high"|"medium"|"low"}]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const text: string =
    data?.content?.map((b: { text?: string }) => b.text ?? "").join("") ?? "";
  // Extract the JSON array (the model may wrap it in ```json fences).
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Vision model returned no JSON array");
  const raw = JSON.parse(match[0]) as Array<Partial<ParsedEntry>>;

  const byId = new Map(roster.map((r) => [r.shiftboard_id, r]));
  return raw
    .filter((e) => e && typeof e.note === "string" && e.note.trim())
    .map((e) => {
      // Trust only a matchedShiftboardId that's actually on this shift.
      const id =
        typeof e.matchedShiftboardId === "number" && byId.has(e.matchedShiftboardId)
          ? e.matchedShiftboardId
          : null;
      return {
        name: String(e.name ?? ""),
        note: String(e.note),
        matchedShiftboardId: id,
        timePositionId: id ? byId.get(id)!.time_position_id : null,
        confidence:
          e.confidence === "high" || e.confidence === "medium" || e.confidence === "low"
            ? e.confidence
            : "low",
      };
    });
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "POST") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  if (!(await isAdmin(session.shiftboardId))) {
    return res.status(403).json({ statusCode: 403, message: "Admins only." });
  }

  const { action } = req.query;
  const body = JSON.parse(req.body || "{}");

  if (action === "save") {
    // Save confirmed notes to matched volunteers. Only writes the notes column.
    const entries: Array<{ shiftboardId: number; timePositionId: number; note: string }> =
      Array.isArray(body.entries) ? body.entries : [];
    let saved = 0;
    for (const e of entries) {
      if (typeof e.shiftboardId !== "number" || typeof e.timePositionId !== "number") continue;
      if (typeof e.note !== "string" || !e.note.trim()) continue;
      await pool.query(
        `UPDATE op_volunteer_shifts SET notes = ?, update_shift = true
          WHERE shiftboard_id = ? AND time_position_id = ? AND remove_shift = false`,
        [e.note.trim(), e.shiftboardId, e.timePositionId]
      );
      saved += 1;
    }
    return res.status(200).json({ statusCode: 200, saved });
  }

  // Default: parse the photo.
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({
      statusCode: 503,
      message: "Photo notes aren't set up yet (no vision API key configured).",
    });
  }
  const imageBase64: string = body.imageBase64 ?? "";
  const mediaType: string = body.mediaType ?? "image/jpeg";
  if (!imageBase64) {
    return res.status(400).json({ statusCode: 400, message: "No image provided." });
  }
  if (Buffer.byteLength(imageBase64, "base64") > MAX_IMAGE_BYTES) {
    return res.status(413).json({ statusCode: 413, message: "Image too large (max ~8MB)." });
  }

  try {
    const roster = await loadRoster(req.query.timeId);
    if (roster.length === 0) {
      return res.status(404).json({ statusCode: 404, message: "No volunteers on this shift." });
    }
    const entries = await readNotesFromPhoto(imageBase64, mediaType, roster);
    return res.status(200).json({ statusCode: 200, entries });
  } catch (err) {
    console.error("[notes-photo] parse failed:", err);
    return res
      .status(502)
      .json({ statusCode: 502, message: "Couldn't read the photo — try a clearer picture." });
  }
};

// Larger body limit for the base64 image (default is 1MB).
export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

export default withAuth(handler);
