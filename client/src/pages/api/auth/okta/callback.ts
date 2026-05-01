import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

interface OktaTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface OktaUserInfo {
  sub: string; // unique Okta user ID
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  nickname?: string;
  // BM custom claim returned by the standard `profile` scope
  playaname?: string;
}

// helper: exchange authorization code for tokens
async function exchangeCode(
  code: string,
  codeVerifier: string
): Promise<OktaTokenResponse> {
  const issuer = process.env.OKTA_ISSUER!;
  const clientId = process.env.OKTA_CLIENT_ID!;
  const clientSecret = process.env.OKTA_CLIENT_SECRET!;
  const redirectUri = process.env.OKTA_REDIRECT_URI!;

  const tokenUrl = `${issuer}/v1/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: codeVerifier,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${text}`);
  }

  return resp.json();
}

// helper: fetch user profile from Okta
async function fetchUserInfo(
  accessToken: string
): Promise<OktaUserInfo> {
  const issuer = process.env.OKTA_ISSUER!;
  const resp = await fetch(`${issuer}/v1/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`UserInfo failed: ${resp.status} ${text}`);
  }

  return resp.json();
}

// helper: build the volunteer account response (same shape as sign-in)
async function buildAccountResponse(shiftboardId: number) {
  const [dbVolunteerList] = await pool.query<RowDataPacket[]>(
    `SELECT
      email,
      emergency_contact,
      create_volunteer,
      location,
      notes,
      phone,
      playa_name,
      shiftboard_id,
      world_name
    FROM op_volunteers
    WHERE shiftboard_id=?`,
    [shiftboardId]
  );
  const volunteer = dbVolunteerList[0];
  if (!volunteer) return null;

  const [dbRoleList] = await pool.query<RowDataPacket[]>(
    `SELECT r.role, r.role_id
    FROM op_volunteer_roles AS vr
    JOIN op_roles AS r ON vr.role_id=r.role_id AND vr.remove_role=false
    WHERE vr.shiftboard_id=?`,
    [shiftboardId]
  );
  const roleList = dbRoleList.map(({ role, role_id }) => ({
    id: role_id,
    name: role,
  }));

  return {
    email: volunteer.email,
    emergencyContact: volunteer.emergency_contact ?? "",
    isCreated: volunteer.create_volunteer,
    location: volunteer.location ?? "",
    notes: volunteer.notes ?? "",
    phone: volunteer.phone ?? "",
    playaName: volunteer.playa_name,
    roleList,
    shiftboardId: volunteer.shiftboard_id,
    worldName: volunteer.world_name,
  };
}

// GET /api/auth/okta/callback — handle Okta OIDC callback
const oktaCallback = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(404).json({ statusCode: 404, message: "Not found" });
  }

  const { code, state, error, error_description } = req.query;

  // Okta returned an error
  if (error) {
    return res.redirect(
      `/sign-in?error=${encodeURIComponent(String(error_description || error))}`
    );
  }

  if (!code || !state) {
    return res.redirect("/sign-in?error=missing_params");
  }

  // validate state and retrieve code verifier from cookie
  const oauthCookie = req.cookies.oauth_state;
  if (!oauthCookie) {
    return res.redirect("/sign-in?error=missing_state");
  }

  let storedState: string;
  let codeVerifier: string;
  try {
    const parsed = JSON.parse(decodeURIComponent(oauthCookie));
    storedState = parsed.state;
    codeVerifier = parsed.codeVerifier;
  } catch {
    return res.redirect("/sign-in?error=invalid_state");
  }

  // extract returnTo from state param (format: "randomhex|/path/to/page")
  const stateStr = String(state);
  const pipeIndex = stateStr.indexOf("|");
  const receivedState = pipeIndex >= 0 ? stateStr.substring(0, pipeIndex) : stateStr;
  const returnTo = pipeIndex >= 0 ? stateStr.substring(pipeIndex + 1) : "";

  if (receivedState !== storedState) {
    return res.redirect("/sign-in?error=state_mismatch");
  }

  // clear the oauth cookie
  res.setHeader("Set-Cookie", [
    "oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  ]);

  try {
    // exchange code for tokens
    const tokens = await exchangeCode(String(code), codeVerifier);

    // fetch user profile
    const userInfo = await fetchUserInfo(tokens.access_token);
    const oktaId = userInfo.sub;
    const email = userInfo.email;
    const playaName =
      userInfo.playaname ||
      userInfo.preferred_username ||
      userInfo.given_name ||
      "";
    const worldName = userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || email;

    if (!email) {
      return res.redirect("/sign-in?error=no_email");
    }

    // try to find existing volunteer by okta_id first, then by email
    let shiftboardId: number | null = null;

    // 1. check by okta_id
    const [byOktaId] = await pool.query<RowDataPacket[]>(
      "SELECT shiftboard_id FROM op_volunteers WHERE okta_id=?",
      [oktaId]
    );
    if (byOktaId.length > 0) {
      shiftboardId = byOktaId[0].shiftboard_id;

      // sync profile data from Okta
      await pool.query(
        `UPDATE op_volunteers
        SET playa_name=?, world_name=?, email=?
        WHERE shiftboard_id=?`,
        [playaName, worldName, email, shiftboardId]
      );
    }

    // 2. check by email
    if (!shiftboardId) {
      const [byEmail] = await pool.query<RowDataPacket[]>(
        "SELECT shiftboard_id FROM op_volunteers WHERE email=?",
        [email]
      );
      if (byEmail.length > 0) {
        shiftboardId = byEmail[0].shiftboard_id;

        // link okta_id and sync profile
        await pool.query(
          `UPDATE op_volunteers
          SET okta_id=?, playa_name=?, world_name=?
          WHERE shiftboard_id=?`,
          [oktaId, playaName, worldName, shiftboardId]
        );
      }
    }

    // 3. create new volunteer
    if (!shiftboardId) {
      const newId = generateId(`
        SELECT shiftboard_id
        FROM op_volunteers
        WHERE shiftboard_id=?
      `);

      await pool.query<RowDataPacket[]>(
        `INSERT INTO op_volunteers (
          shiftboard_id, playa_name, world_name, email, okta_id, create_volunteer
        ) VALUES (?, ?, ?, ?, ?, true)`,
        [newId, playaName, worldName, email, oktaId]
      );
      shiftboardId = newId;
    }

    // build the account response (same shape as passcode sign-in)
    const account = await buildAccountResponse(shiftboardId);
    if (!account) {
      return res.redirect("/sign-in?error=account_error");
    }

    // encode account data for client-side session hydration
    const accountData = encodeURIComponent(JSON.stringify(account));
    const redirectPath = returnTo && returnTo.startsWith("/") ? returnTo : `/volunteers/${shiftboardId}/account`;

    return res.redirect(
      `/auth/complete?data=${accountData}&returnTo=${encodeURIComponent(redirectPath)}`
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.redirect("/sign-in?error=callback_failed");
  }
};

export default oktaCallback;
