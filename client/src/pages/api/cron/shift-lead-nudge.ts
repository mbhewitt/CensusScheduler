import type { NextApiRequest, NextApiResponse } from "next";

import {
  runShiftLeadNudge,
  runShiftLeadNudgeCatchup,
} from "@/lib/shiftLeadNudge";
import { pool } from "lib/database";

// Scheduled entry point for the shift-lead nudge (see lib/shiftLeadNudge).
// Meant to be hit every ~15 min by a cron/curl. Protected by a shared secret
// (CRON_SECRET) rather than a session — it's machine-to-machine. Also
// allowlisted in middleware so the request reaches this handler.
//
//   POST /api/cron/shift-lead-nudge            -> steady-state, per-shift, 24h
//   POST /api/cron/shift-lead-nudge?catchup=1  -> one-time consolidated-per-lead
//                                                 backlog pass (no age cap)
//   ...&dryRun=1                               -> report only, no send / no write
//   Header: Authorization: Bearer <CRON_SECRET>
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ statusCode: 401, message: "Unauthorized" });
  }
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  try {
    const dryRun = req.query.dryRun === "1" || req.query.dryRun === "true";
    // ?catchup=1 runs the one-time consolidated-per-lead backlog pass (no age
    // cap); otherwise the steady-state per-shift 24h pass.
    const catchup = req.query.catchup === "1" || req.query.catchup === "true";
    const result = catchup
      ? await runShiftLeadNudgeCatchup(pool, { dryRun })
      : await runShiftLeadNudge(pool, { dryRun });
    return res.status(200).json({ statusCode: 200, ...result });
  } catch (err) {
    console.error("[shift-lead-nudge] run failed:", err);
    return res
      .status(500)
      .json({ statusCode: 500, message: "Nudge run failed" });
  }
}
