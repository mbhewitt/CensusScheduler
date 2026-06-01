import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { buildSessionCookie } from "@/lib/session";
import { generateId } from "@/utils/generateId";
import { generatePasscode } from "@/utils/generatePasscode";
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

// fetch with retries that ride through transient outages without the user
// seeing them. Observed behavior in prod: occasional ~60s windows where
// POSTs to login.burningman.org (Cloudflare) fail with `fetch failed`,
// while other endpoints stay reachable. Most likely a stale pooled
// connection or CDN-side hiccup that recovers when we reconnect.
//
// 5 attempts, fail-fast 8s timeout per attempt, exponential backoff
// (250ms, 750ms, 2.5s, 6s) with light jitter -- worst-case total wait
// ~50s. Anything longer than that we want to surface to the user.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> {
  const maxAttempts = 5;
  const perAttemptTimeoutMs = 8_000;
  const backoffsMs = [250, 750, 2_500, 6_000]; // length === maxAttempts - 1
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(perAttemptTimeoutMs),
      });
    } catch (err) {
      lastErr = err;
      const causeStr =
        err instanceof Error && err.cause
          ? `${(err.cause as { code?: string }).code ?? ""}: ${(err.cause as { message?: string }).message ?? ""}`
          : "";
      console.warn(
        `${label} attempt ${attempt}/${maxAttempts} failed:`,
        err instanceof Error ? err.message : err,
        causeStr ? `| cause: ${causeStr}` : ""
      );
      if (attempt === maxAttempts) break;
      const backoff = backoffsMs[attempt - 1];
      // jitter +/- 20% so concurrent retries don't synchronize on a CDN
      const jittered = backoff * (0.8 + Math.random() * 0.4);
      await new Promise((resolve) => setTimeout(resolve, jittered));
    }
  }
  // Surface err.cause if present -- without it Node's fetch errors just say
  // "fetch failed" which is useless for diagnosing.
  const top = lastErr instanceof Error ? lastErr.message : String(lastErr);
  const cause =
    lastErr instanceof Error && lastErr.cause
      ? ` (${(lastErr.cause as { code?: string; message?: string }).code ?? ""}${
          (lastErr.cause as { message?: string }).message
            ? `: ${(lastErr.cause as { message: string }).message}`
            : ""
        })`
      : "";
  throw new Error(
    `${label} failed after ${maxAttempts} attempts: ${top}${cause}`
  );
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

  const resp = await fetchWithRetry(
    tokenUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
    "Token exchange"
  );

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
  const resp = await fetchWithRetry(
    `${issuer}/v1/userinfo`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
    "UserInfo"
  );

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

  if (process.env.NEXT_PUBLIC_OKTA_ENABLED !== "true") {
    return res.status(403).json({
      statusCode: 403,
      message: "Okta sign-in is not enabled for this deployment",
    });
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
  } catch (err) {
    // Log the raw cookie value (truncated) so we can diagnose the
    // intermittent "[object Object]" SyntaxError seen in prod.
    console.error(
      "OAuth state cookie parse failed:",
      err,
      "raw cookie:",
      oauthCookie.slice(0, 80)
    );
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

    // 2. check by email on op_volunteers
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

    // 3. check by email in sb_pinfo (Shiftboard email history, SCD2).
    //    This catches the case where the BM volunteer record exists with
    //    a canonical shiftboard_id but the row has never been imported
    //    into op_volunteers yet (or never been linked to Okta). The lookup
    //    matches any historical email -- it preferes the current row
    //    (valid_to IS NULL) but falls back to the most recently valid
    //    historical row if the user's Okta email is an older one.
    //
    //    Wrapped in try/catch so deployments that don't have sb_pinfo yet
    //    (e.g. on-playa boxes) fall through to the create-new branch.
    if (!shiftboardId) {
      try {
        const [bySbPinfo] = await pool.query<RowDataPacket[]>(
          `SELECT shiftboard_id FROM sb_pinfo
           WHERE email=?
           ORDER BY (valid_to IS NULL) DESC, valid_from DESC
           LIMIT 1`,
          [email]
        );
        if (bySbPinfo.length > 0) {
          const canonicalId = bySbPinfo[0].shiftboard_id;

          // Does op_volunteers already have this canonical id (e.g. from
          // a prior DB seed) but with no Okta link yet? Link and sync.
          const [existingByCanonical] = await pool.query<RowDataPacket[]>(
            "SELECT shiftboard_id FROM op_volunteers WHERE shiftboard_id=?",
            [canonicalId]
          );
          if (existingByCanonical.length > 0) {
            shiftboardId = canonicalId;
            await pool.query(
              `UPDATE op_volunteers
              SET okta_id=?, playa_name=?, world_name=?, email=?
              WHERE shiftboard_id=?`,
              [oktaId, playaName, worldName, email, shiftboardId]
            );
          } else {
            // Canonical id known from Shiftboard history but no row exists
            // here yet -- create one using the canonical id (NOT a random
            // generateId) so we stay consistent with the rest of the
            // Census ecosystem.
            await pool.query<RowDataPacket[]>(
              `INSERT INTO op_volunteers (
                shiftboard_id, playa_name, world_name, email, okta_id, create_volunteer
              ) VALUES (?, ?, ?, ?, ?, true)`,
              [canonicalId, playaName, worldName, email, oktaId]
            );
            shiftboardId = canonicalId;
          }
        }
      } catch (sbErr) {
        // sb_pinfo missing or query failed -- not fatal, fall through to
        // creating a new volunteer with a generated id below.
        console.warn(
          "sb_pinfo lookup skipped:",
          sbErr instanceof Error ? sbErr.message : sbErr
        );
      }
    }

    // 4. create new volunteer with a generated id
    if (!shiftboardId) {
      const newId = await generateId(`
        SELECT shiftboard_id
        FROM op_volunteers
        WHERE shiftboard_id=?
      `);
      // Auto-generate a 4-digit passcode so the volunteer can sign in
      // on-playa via the tablet PIN UI without an admin having to set
      // one for them. The volunteer can see and update it from /info.
      const passcode = generatePasscode();

      await pool.query<RowDataPacket[]>(
        `INSERT INTO op_volunteers (
          shiftboard_id, playa_name, world_name, email, okta_id, passcode, create_volunteer
        ) VALUES (?, ?, ?, ?, ?, ?, true)`,
        [newId, playaName, worldName, email, oktaId, passcode]
      );
      shiftboardId = newId;
    }

    // build the account response (same shape as passcode sign-in)
    const account = await buildAccountResponse(shiftboardId);
    if (!account) {
      return res.redirect("/sign-in?error=account_error");
    }

    // hotfix 2026-05-06: set the server-side session cookie so the
    // middleware (and API guards) recognize this user as authenticated.
    res.setHeader("Set-Cookie", buildSessionCookie(shiftboardId));

    // encode account data for client-side session hydration
    const accountData = encodeURIComponent(JSON.stringify(account));
    const redirectPath = returnTo && returnTo.startsWith("/") ? returnTo : `/volunteers/${shiftboardId}/info`;

    return res.redirect(
      `/auth/complete?data=${accountData}&returnTo=${encodeURIComponent(redirectPath)}`
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    // Surface a short error string in the redirect so the user/admin can
    // see what failed without having to grep server logs. Truncate hard
    // to keep the URL short and to avoid leaking long server traces.
    const detail = err instanceof Error ? err.message : String(err);
    const safeDetail = detail.replace(/[\r\n]+/g, " ").slice(0, 160);
    return res.redirect(
      `/sign-in?error=${encodeURIComponent(`callback_failed: ${safeDetail}`)}`
    );
  }
};

export default oktaCallback;
