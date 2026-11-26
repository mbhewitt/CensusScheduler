// Discord OAuth ("Connect Discord" on the volunteer info page). The redirect URI must
// match one registered on the Discord application exactly. It defaults to this
// deployment's origin (taken from OKTA_REDIRECT_URI), and DISCORD_REDIRECT_URI
// overrides it on deployments without Okta.
export function discordRedirectUri(): string | null {
  if (process.env.DISCORD_REDIRECT_URI) return process.env.DISCORD_REDIRECT_URI;
  if (!process.env.OKTA_REDIRECT_URI) return null;
  return new URL(
    "/api/auth/discord/callback",
    process.env.OKTA_REDIRECT_URI
  ).toString();
}

export const DISCORD_STATE_COOKIE = "discord_oauth_state";
