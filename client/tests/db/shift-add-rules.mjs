// Shift-add rules end to end (C-863 A2): preflight + POST against a real DB,
// including a race for the last slot. Not part of test:unit (needs a DB).
//
// 1. Scratch DB: database/scheduler_schema.sql + migrations/*.sql, then
//    tests/db/shift-add-rules.seed.sql, then
//    UPDATE op_shift_time_position SET slots=1 WHERE time_position_id=4;
// 2. next dev -p 3055 with MYSQL_* → that DB, PUMPKIN_SECRET=a2-local-test-secret,
//    NEXT_PUBLIC_PIN_ENABLED=false
// 3. node tests/db/shift-add-rules.mjs   → "ALL PASS"
const { subtle } = globalThis.crypto;
const enc = new TextEncoder();
const b64u = (b) => Buffer.from(b).toString("base64url");
const hex = async (s) => Buffer.from(await subtle.digest("SHA-256", enc.encode(s))).toString("hex");
const SECRET = "a2-local-test-secret";
const BASE = "http://127.0.0.1:3055";
let fails = 0;
async function call(who, method, path, bodyObj) {
  const body = bodyObj ? JSON.stringify(bodyObj) : "";
  const p = { shiftboardId: who, method, path, bodySha256: await hex(body), exp: Date.now() + 50000, nonce: "a2-" + Math.random().toString(36).slice(2) + "-xxxxxx" };
  const pl = b64u(enc.encode(JSON.stringify(p)));
  const key = await subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const tok = `pk1.${pl}.${b64u(new Uint8Array(await subtle.sign("HMAC", key, enc.encode("pk1." + pl))))}`;
  const r = await fetch(BASE + path, { method, headers: { authorization: `Bearer ${tok}`, "content-type": "text/plain" }, body: body || undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j };
}
const add = (who, sb, tp) => call(who, "POST", "/api/shifts/1/volunteers", { id: 1, shiftboardId: sb, timePositionId: tp });
const pre = (who, sb, tp) => call(who, "POST", "/api/shifts/1/volunteers/preflight", { shiftboardId: sb, timePositionId: tp });
function expect(label, got, status, pred = () => true) {
  const ok = got.status === status && pred(got.j);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${got.status} ${JSON.stringify(got.j).slice(0, 200)}`);
}
const codes = (j) => (j?.blockers ?? []).map((b) => b.code);

expect("A preflight clean", await pre(11, 11, 1), 200, (j) => j.blockers.length === 0);
expect("B self add tp1", await add(11, 11, 1), 201, (j) => Array.isArray(j.warnings));
expect("C full blocks non-admin", await add(12, 12, 1), 403, (j) => codes(j).includes("full"));
expect("C2 admin overrides full (warned)", await add(10, 12, 1), 201, (j) => j.warnings.some((w) => /full/.test(w)));
expect("E overlap blocks", await add(11, 11, 2), 403, (j) => codes(j).includes("time-conflict"));
expect("E2 admin preflight overlap = warning", await pre(10, 11, 2), 200, (j) => j.blockers.length === 0 && j.warnings.some((w) => /overlaps/.test(w)));
expect("E3 back-to-back ok", await add(11, 11, 3), 201);
expect("F role required", await add(11, 11, 5), 403, (j) => codes(j).includes("role-required"));
expect("G training = warning only", await pre(13, 13, 6), 200, (j) => j.blockers.length === 0 && j.warnings.some((w) => /training/.test(w)));
expect("H max-one first", await add(12, 12, 8), 201);
expect("H2 max-one second blocked", await add(12, 12, 7), 403, (j) => codes(j).includes("max-per-volunteer"));
expect("I thank-you CSP (1 < 2)", await pre(12, 12, 9), 200, (j) => codes(j).includes("min-csp") && /thank-you/.test(j.blockers[0].message));
expect("J canceled blocks admin", await add(10, 13, 10), 409, (j) => codes(j).includes("canceled"));
expect("K past shift add (admin)", await add(10, 13, 11), 201);
expect("L non-admin adds other", await add(11, 12, 5), 403, (j) => codes(j).join() === "admin-only");
expect("M non-admin preflight other = only admin-only", await pre(11, 12, 9), 200, (j) => codes(j).join() === "admin-only" && j.warnings.length === 0);
expect("N unknown position", await add(11, 11, 9999), 404);
expect("N2 bad ids", await call(11, "POST", "/api/shifts/1/volunteers", { shiftboardId: "x", timePositionId: 1 }), 400);
expect("O remove", await call(11, "DELETE", "/api/shifts/1/volunteers", { shiftboardId: 11, timePositionId: 3 }), 200, (j) => Array.isArray(j.warnings));
expect("O2 re-add after remove", await add(11, 11, 3), 201);

// concurrency: two volunteers race for the last slot of tp4 (slots set to 1 by the runner)
const [r1, r2] = await Promise.all([add(13, 13, 4), add(14, 14, 4)]);
const sts = [r1.status, r2.status].sort().join(",");
const ok = sts === "201,403";
if (!ok) fails++;
console.log(`${ok ? "PASS" : "FAIL"} P race for last slot: ${sts} ${JSON.stringify([r1.j, r2.j]).slice(0, 200)}`);
console.log(fails ? `${fails} FAILED` : "ALL PASS");
