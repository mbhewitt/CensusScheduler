import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { withAuth } from "@/lib/withAuth";
import { isOwnerOrAdmin } from "@/lib/authz";

// GET /api/volunteers/[shiftboardId]/display — names only, for the pumpkin
// gate's approval cards (C-863 A6). Never add email/phone here; contact info
// goes through the info endpoint. Same owner-or-admin gate as info (#410).
const volunteerDisplay = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  const shiftboardId = Number(req.query.shiftboardId);
  if (!Number.isInteger(shiftboardId) || shiftboardId <= 0) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "Bad shiftboardId" });
  }
  if (!(await isOwnerOrAdmin(session, shiftboardId))) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT playa_name, world_name
     FROM op_volunteers
     WHERE delete_volunteer=false
     AND shiftboard_id=?`,
    [shiftboardId]
  );
  if (!rows.length) {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
  return res.status(200).json({
    world_name: rows[0].world_name,
    playa_name: rows[0].playa_name,
  });
};

export default withAuth(volunteerDisplay);
