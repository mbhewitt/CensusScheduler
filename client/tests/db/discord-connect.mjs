// "Connect Discord" end to end (OAuth start/callback + unlink) against a real
// DB, with discord.com answered locally. Not part of test:unit (needs a DB).
//
// 1. Scratch DB as in shift-add-rules.mjs (schema + migrations + its seed).
// 2. next dev -p 3055 with MYSQL_* → that DB, PUMPKIN_SECRET=a2-local-test-secret,
//    NEXT_PUBLIC_PIN_ENABLED=false, DISCORD_CLIENT_ID=dummy-id,
//    DISCORD_CLIENT_SECRET=dummy-secret,
//    DISCORD_REDIRECT_URI=http://localhost:3055/api/auth/discord/callback,
//    NODE_OPTIONS="--require <mock>" where the mock answers
//    https://discord.com/api/oauth2/token (code → "tok-<code>", 400 for "bad")
//    and /api/users/@me (token "tok-<id>" → {id}).
// 3. node tests/db/discord-connect.mjs   → "ALL PASS"
const { subtle } = globalThis.crypto;
const enc = new TextEncoder();
const b64u = (b) => Buffer.from(b).toString("base64url");
const hex = async (s) => Buffer.from(await subtle.digest("SHA-256", enc.encode(s))).toString("hex");
const SECRET = "a2-local-test-secret";
const BASE = "http://127.0.0.1:3055";
let fails = 0;
async function call(who, method, path, { body = "", cookie } = {}) {
  const p = { shiftboardId: who, method, path, bodySha256: await hex(body), exp: Date.now() + 50000, nonce: "dc-" + Math.random().toString(36).slice(2) + "-xxxxxx" };
  const pl = b64u(enc.encode(JSON.stringify(p)));
  const key = await subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const tok = `pk1.${pl}.${b64u(new Uint8Array(await subtle.sign("HMAC", key, enc.encode("pk1." + pl))))}`;
  const headers = { authorization: `Bearer ${tok}`, "content-type": "text/plain" };
  if (cookie) headers.cookie = cookie;
  const r = await fetch(BASE + path, { method, headers, body: body || undefined, redirect: "manual" });
  return { status: r.status, location: r.headers.get("location") ?? "", setCookie: r.headers.get("set-cookie") ?? "", text: await r.text() };
}
function expect(label, ok, got) {
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${got.status} ${got.location || got.text.slice(0, 120)}`);
}
// start: redirect to Discord with identify scope + a state that is also cookied
async function start(who) {
  const r = await call(who, "GET", "/api/auth/discord");
  const state = r.location ? new URL(r.location).searchParams.get("state") : null;
  return { r, state, cookie: `discord_oauth_state=${state}` };
}
const cb = (who, code, state, cookie) =>
  call(who, "GET", `/api/auth/discord/callback?code=${code}&state=${state}`, { cookie });
const linked = async (who) => JSON.parse((await call(who, "GET", `/api/volunteers/${who}/account`)).text).isDiscordLinked;
const ID1 = "111111111111111111", ID2 = "222222222222222222";

const s = await start(11);
const u = s.r.location ? new URL(s.r.location) : null;
expect("A start → discord.com identify", s.r.status === 302 && u?.host === "discord.com" && u.searchParams.get("scope") === "identify" && u.searchParams.get("redirect_uri") === "http://localhost:3055/api/auth/discord/callback" && s.r.setCookie.includes(`discord_oauth_state=${s.state}`), s.r);
expect("B unauthenticated start → 401", (await fetch(BASE + "/api/auth/discord", { redirect: "manual" })).status === 401, { status: "", location: "", text: "" });
let r = await cb(11, ID1, "forged", s.cookie);
expect("C wrong state → error, nothing saved", r.location.endsWith("/volunteers/11/info?discord=error") && !(await linked(11)), r);
r = await cb(11, ID1, s.state, "");
expect("D missing state cookie → error", r.location.endsWith("?discord=error"), r);
r = await cb(11, "bad", s.state, s.cookie);
expect("E Discord token failure → error", r.location.endsWith("?discord=error") && !(await linked(11)), r);
r = await cb(11, ID1, s.state, s.cookie);
expect("F happy path → linked + state cookie cleared", r.location.endsWith("/volunteers/11/info?discord=linked") && r.setCookie.includes("Max-Age=0") && (await linked(11)), r);
const s12 = await start(12);
r = await cb(12, ID1, s12.state, s12.cookie);
expect("G same Discord on another volunteer → taken", r.location.endsWith("/volunteers/12/info?discord=taken") && !(await linked(12)), r);
r = await call(12, "GET", `/api/volunteers/by-discord/${ID1}`);
expect("H lookup still non-admin 403", r.status === 403, r);
r = await call(10, "GET", `/api/volunteers/by-discord/${ID1}`);
expect("I admin lookup → volunteer 11", r.status === 200 && JSON.parse(r.text).shiftboard_id === 11, r);
r = await call(12, "PUT", "/api/volunteers/11/discord", { body: JSON.stringify({ discordUserId: null }) });
expect("J non-admin can't unlink someone else", r.status === 403 && (await linked(11)), r);
r = await call(12, "PUT", "/api/volunteers/12/discord", { body: JSON.stringify({ discordUserId: ID2 }) });
expect("K non-admin can't set an id directly", r.status === 403 && !(await linked(12)), r);
r = await call(11, "PUT", "/api/volunteers/11/discord", { body: JSON.stringify({ discordUserId: null }) });
expect("L self unlink", r.status === 200 && !(await linked(11)), r);
r = await cb(12, ID1, s12.state, s12.cookie);
expect("M freed Discord can now link to 12", r.location.endsWith("?discord=linked") && (await linked(12)), r);
r = await call(10, "PUT", "/api/volunteers/12/discord", { body: JSON.stringify({ discordUserId: null }) });
expect("N admin unlink other", r.status === 200 && !(await linked(12)), r);
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
