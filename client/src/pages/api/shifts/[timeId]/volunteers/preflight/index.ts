import type { NextApiRequest, NextApiResponse } from "next";

import { checkShiftAdd } from "@/components/api/shiftAddRules";
import { isOnPlayaRequest } from "@/lib/onPlaya";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";

// POST /api/shifts/[timeId]/volunteers/preflight  {shiftboardId, timePositionId}
// → {blockers[], warnings[]}: what POST …/volunteers would say, without
// writing (C-863 A2). The add dialog and the pumpkin gate both call it, so the
// rules live only in checkShiftAdd. POST re-checks under its lock, so a
// preflight is advice, not a reservation.
const shiftVolunteerPreflight = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  let body: { shiftboardId?: unknown; timePositionId?: unknown };
  try {
    body = JSON.parse(req.body);
  } catch {
    return res.status(400).json({ statusCode: 400, message: "Bad body" });
  }
  const shiftboardId = Number(body.shiftboardId);
  const timePositionId = Number(body.timePositionId);
  if (
    !Number.isInteger(shiftboardId) ||
    shiftboardId <= 0 ||
    !Number.isInteger(timePositionId) ||
    timePositionId <= 0
  ) {
    return res.status(400).json({ statusCode: 400, message: "Bad ids" });
  }

  const check = await checkShiftAdd(pool, {
    actorShiftboardId: session.shiftboardId,
    isOnPlaya: isOnPlayaRequest(req.cookies),
    shiftboardId,
    timePositionId,
  });
  if (check.notFound) {
    return res
      .status(404)
      .json({ statusCode: 404, message: `Unknown ${check.notFound}.` });
  }
  return res
    .status(200)
    .json({ blockers: check.blockers, warnings: check.warnings });
};

export default withAuth(shiftVolunteerPreflight);
