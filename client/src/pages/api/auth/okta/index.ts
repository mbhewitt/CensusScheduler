import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

// GET /api/auth/okta — initiate Okta OIDC authorization code flow
const oktaAuthorize = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }

  const clientId = process.env.OKTA_CLIENT_ID;
  const issuer = process.env.OKTA_ISSUER;
  const redirectUri = process.env.OKTA_REDIRECT_URI;

  if (!clientId || !issuer || !redirectUri) {
    return res.status(500).json({
      statusCode: 500,
      message: "OAuth not configured",
    });
  }

  // generate CSRF state token
  const state = crypto.randomBytes(32).toString("hex");

  // generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // store state + code verifier in a secure httpOnly cookie
  const oauthData = JSON.stringify({ state, codeVerifier });
  res.setHeader("Set-Cookie", [
    `oauth_state=${encodeURIComponent(oauthData)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  ]);

  // preserve returnTo if provided
  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "";
  const stateParam = returnTo ? `${state}|${returnTo}` : state;

  const authUrl = new URL(`${issuer}/v1/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", stateParam);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  return res.redirect(302, authUrl.toString());
};

export default oktaAuthorize;
