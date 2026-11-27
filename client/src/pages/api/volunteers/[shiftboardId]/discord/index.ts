import type { ResultSetHeader } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { isAdmin } from "@/lib/authz";
import { withAuth } from "@/lib/withAuth";

// PUT /api/volunteers/[shiftboardId]/discord  {discordUserId: string | null}
// Sets or clears a volunteer's Discord link (C-863 A7). Setting is admin only
// (the pumpkin registration card calls this as the owner); a volunteer may
// clear their own ("Disconnect" on the volunteer info page). Self-service linking goes
// through Discord OAuth (/api/auth/discord), which writes this same column.
// ponytail: no history yet; the #620 change log records link changes when it lands.
const volunteerDiscord = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "PUT") {
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

  let discordUserId: unknown;
  try {
    ({ discordUserId } = JSON.parse(req.body));
  } catch {
    return res.status(400).json({ statusCode: 400, message: "Bad body" });
  }
  const isSelfUnlink =
    discordUserId === null && session.shiftboardId === shiftboardId;
  if (!isSelfUnlink && !(await isAdmin(session.shiftboardId))) {
    return res.status(403).json({ statusCode: 403, message: "Forbidden" });
  }
  if (
    discordUserId !== null &&
    !(typeof discordUserId === "string" && /^\d{17,20}$/.test(discordUserId))
  ) {
    return res
      .status(400)
      .json({ statusCode: 400, message: "Bad discordUserId" });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE op_volunteers
       SET discord_user_id = ?
       WHERE delete_volunteer = false
         AND shiftboard_id = ?`,
      [discordUserId, shiftboardId]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ statusCode: 404, message: "Not found" });
    }
  } catch (err) {
    // Unique index: that Discord account is already linked to someone else.
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        statusCode: 409,
        message: "Discord account already linked to another volunteer",
      });
    }
    throw err;
  }
  return res.status(200).json({ shiftboard_id: shiftboardId, discordUserId });
};

export default withAuth(volunteerDiscord);
