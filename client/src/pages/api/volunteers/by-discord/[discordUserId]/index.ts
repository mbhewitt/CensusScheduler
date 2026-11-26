import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { ROLE_PUMPKIN_USER_ID } from "@/constants";
import { pool } from "lib/database";
import { isAdmin } from "@/lib/authz";
import { withAuth } from "@/lib/withAuth";

// GET /api/volunteers/by-discord/[discordUserId] — admin only (C-863 A7).
// The pumpkin gate resolves a Discord author to a volunteer here on every
// call; the app is the only place the link lives. Names only, no contact info.
const volunteerByDiscord = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }
  const discordUserId = String(req.query.discordUserId);
  if (!/^\d{17,20}$/.test(discordUserId)) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "Bad discordUserId" });
  }
  if (!(await isAdmin(session.shiftboardId))) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT v.shiftboard_id, v.playa_name, v.world_name,
       EXISTS (
         SELECT 1 FROM op_volunteer_roles vr
         WHERE vr.shiftboard_id = v.shiftboard_id
           AND vr.role_id = ?
           AND vr.remove_role = false
       ) AS may_use
     FROM op_volunteers v
     WHERE v.delete_volunteer = false
       AND v.discord_user_id = ?`,
    [ROLE_PUMPKIN_USER_ID, discordUserId]
  );
  if (!rows.length) {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
  const [row] = rows;
  return res.status(200).json({
    shiftboard_id: row.shiftboard_id,
    playa_name: row.playa_name,
    world_name: row.world_name,
    may_use: Boolean(row.may_use),
  });
};

export default withAuth(volunteerByDiscord);
