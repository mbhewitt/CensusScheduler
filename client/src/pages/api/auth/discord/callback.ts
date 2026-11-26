import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { DISCORD_STATE_COOKIE, discordRedirectUri } from "@/lib/discordOAuth";
import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";

// GET /api/auth/discord/callback — Discord sends the volunteer back here.
// Exchanges the code, reads their Discord user id, and links it to the
// *signed-in* volunteer only. Always ends on their volunteer info page with
// ?discord=linked|taken|error for the snackbar.
const discordCallback = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  const account = (result: "linked" | "taken" | "error") => {
    res.redirect(
      302,
      `/volunteers/${session.shiftboardId}/info?discord=${result}`
    );
  };
  res.setHeader(
    "Set-Cookie",
    `${DISCORD_STATE_COOKIE}=; Path=/api/auth/discord; HttpOnly; SameSite=Lax; Max-Age=0`
  );

  const { code, state } = req.query;
  const expected = req.cookies[DISCORD_STATE_COOKIE] ?? "";
  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    state.length !== expected.length ||
    !expected ||
    !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected))
  ) {
    // Also where a declined consent lands (?error=access_denied).
    return account("error");
  }

  let discordUserId: string;
  try {
    const tokenResp = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID ?? "",
        client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
        grant_type: "authorization_code",
        code,
        redirect_uri: discordRedirectUri() ?? "",
      }).toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResp.ok) throw new Error(`token ${tokenResp.status}`);
    const { access_token } = await tokenResp.json();
    const meResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!meResp.ok) throw new Error(`users/@me ${meResp.status}`);
    ({ id: discordUserId } = await meResp.json());
    if (!/^\d{17,20}$/.test(discordUserId)) throw new Error("bad id");
  } catch (err) {
    console.warn("Discord connect failed:", (err as Error).message);
    return account("error");
  }

  try {
    await pool.query(
      `UPDATE op_volunteers
       SET discord_user_id = ?
       WHERE delete_volunteer = false
         AND shiftboard_id = ?`,
      [discordUserId, session.shiftboardId]
    );
  } catch (err) {
    // Unique index: that Discord account is linked to another volunteer.
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return account("taken");
    }
    throw err;
  }
  return account("linked");
};

export default withAuth(discordCallback);
