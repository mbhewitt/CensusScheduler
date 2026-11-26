import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { DISCORD_STATE_COOKIE, discordRedirectUri } from "@/lib/discordOAuth";
import { withAuth } from "@/lib/withAuth";

// GET /api/auth/discord — start "Connect Discord" for the signed-in volunteer.
// Discord's own sign-in proves the account is theirs; the callback saves the
// id to op_volunteers.discord_user_id (the same link pumpkin looks up).
const discordAuthorize = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = discordRedirectUri();
  if (!clientId || !process.env.DISCORD_CLIENT_SECRET || !redirectUri) {
    return res
      .status(500)
      .json({ statusCode: 500, message: "Discord not configured" });
  }

  const state = crypto.randomBytes(32).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `${DISCORD_STATE_COOKIE}=${state}; Path=/api/auth/discord; HttpOnly; SameSite=Lax; Max-Age=600`
  );

  const authUrl = new URL("https://discord.com/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "identify");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "none");
  res.redirect(302, authUrl.toString());
};

export default withAuth(discordAuthorize);
