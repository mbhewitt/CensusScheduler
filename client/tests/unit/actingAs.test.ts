import assert from "node:assert/strict";
import { test } from "node:test";

import type { NextApiRequest } from "next";

import {
  extractActingAsToken,
  mintActingAsToken,
  sha256Hex,
  verifyActingAsToken,
  type ActingAsPayload,
} from "../../src/lib/actingAs";
import { readSessionFromRequest } from "../../src/lib/session";

const SECRET = "test-pumpkin-secret";
process.env.PUMPKIN_SECRET = SECRET;
process.env.SESSION_SECRET = "test-session-secret";
process.env.NEXT_PUBLIC_PIN_ENABLED = "false"; // off-playa build

let n = 0;
async function payload(over: Partial<ActingAsPayload> = {}) {
  return {
    shiftboardId: 42,
    method: "GET",
    path: "/api/volunteers/42/info",
    bodySha256: await sha256Hex(""),
    exp: Date.now() + 30_000,
    nonce: `nonce-${Date.now()}-${n++}-padding`,
    ...over,
  };
}

function req(
  token: string | null,
  over: Partial<{
    method: string;
    url: string;
    body: unknown;
    headers: Record<string, string>;
  }> = {}
) {
  return {
    method: "GET",
    url: "/api/volunteers/42/info",
    body: "",
    cookies: {},
    ...over,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...over.headers,
    },
  } as unknown as NextApiRequest;
}

test("verify: a freshly minted token round-trips", async () => {
  const p = await payload();
  const t = await mintActingAsToken(p, SECRET);
  assert.deepEqual(await verifyActingAsToken(t, SECRET), p);
});

test("verify: wrong secret, no secret, tampered payload, bad expiry → null", async () => {
  const p = await payload();
  const t = await mintActingAsToken(p, SECRET);
  assert.equal(await verifyActingAsToken(t, "other"), null);
  assert.equal(await verifyActingAsToken(t, undefined), null);
  assert.equal(await verifyActingAsToken(t, ""), null);
  const [, b64, sig] = t.split(".");
  const forged = Buffer.from(
    JSON.stringify({ ...p, shiftboardId: 1 }),
    "utf8"
  ).toString("base64url");
  assert.equal(await verifyActingAsToken(`pk1.${forged}.${sig}`, SECRET), null);
  assert.equal(await verifyActingAsToken(`pk1.${b64}`, SECRET), null);
  const expired = await mintActingAsToken(
    await payload({ exp: Date.now() - 1 }),
    SECRET
  );
  assert.equal(await verifyActingAsToken(expired, SECRET), null);
  const tooLong = await mintActingAsToken(
    await payload({ exp: Date.now() + 120_000 }),
    SECRET
  );
  assert.equal(await verifyActingAsToken(tooLong, SECRET), null);
});

test("extract: only pk1 Bearers are ours (CRON_SECRET Bearer is not)", () => {
  assert.equal(extractActingAsToken("Bearer pk1.a.b"), "pk1.a.b");
  assert.equal(extractActingAsToken("Bearer some-cron-secret"), null);
  assert.equal(extractActingAsToken(undefined), null);
});

test("request: valid Bearer → that volunteer's session; replay refused", async () => {
  const t = await mintActingAsToken(await payload(), SECRET);
  assert.equal((await readSessionFromRequest(req(t)))?.shiftboardId, 42);
  // A NEW request with the same token is a replay.
  assert.equal(await readSessionFromRequest(req(t)), null);
});

test("request: same request read twice keeps its session", async () => {
  const t = await mintActingAsToken(await payload(), SECRET);
  const r = req(t);
  assert.equal((await readSessionFromRequest(r))?.shiftboardId, 42);
  assert.equal((await readSessionFromRequest(r))?.shiftboardId, 42);
});

test("request: method, path, query and body are bound", async () => {
  const t1 = await mintActingAsToken(await payload(), SECRET);
  assert.equal(await readSessionFromRequest(req(t1, { method: "DELETE" })), null);
  const t2 = await mintActingAsToken(await payload(), SECRET);
  assert.equal(
    await readSessionFromRequest(req(t2, { url: "/api/volunteers/43/info" })),
    null
  );
  const t3 = await mintActingAsToken(await payload(), SECRET);
  assert.equal(
    await readSessionFromRequest(req(t3, { url: "/api/volunteers/42/info?x=1" })),
    null
  );

  const body = JSON.stringify({ shiftboardId: 42, noShow: "" });
  const post = await payload({
    method: "POST",
    path: "/api/shifts/7/volunteers",
    bodySha256: await sha256Hex(body),
  });
  const t4 = await mintActingAsToken(post, SECRET);
  const swapped = JSON.stringify({ shiftboardId: 99, noShow: "" });
  assert.equal(
    await readSessionFromRequest(
      req(t4, { method: "POST", url: post.path, body: swapped })
    ),
    null
  );
  const t5 = await mintActingAsToken({ ...post, nonce: post.nonce + "b" }, SECRET);
  assert.equal(
    (
      await readSessionFromRequest(
        req(t5, { method: "POST", url: post.path, body })
      )
    )?.shiftboardId,
    42
  );
  // A pre-parsed (application/json) body can't be bound → refused.
  const t6 = await mintActingAsToken({ ...post, nonce: post.nonce + "c" }, SECRET);
  assert.equal(
    await readSessionFromRequest(
      req(t6, { method: "POST", url: post.path, body: JSON.parse(body) })
    ),
    null
  );
});

test("request: never valid on /api/cron", async () => {
  const p = await payload({ path: "/api/cron/shift-lead-nudge" });
  const t = await mintActingAsToken(p, SECRET);
  assert.equal(await readSessionFromRequest(req(t, { url: p.path })), null);
});

test("request: no PUMPKIN_SECRET refuses every Bearer", async () => {
  const t = await mintActingAsToken(await payload(), SECRET);
  delete process.env.PUMPKIN_SECRET;
  try {
    assert.equal(await readSessionFromRequest(req(t)), null);
  } finally {
    process.env.PUMPKIN_SECRET = SECRET;
  }
});

test("request: refused on an on-playa build", async () => {
  const t = await mintActingAsToken(await payload(), SECRET);
  process.env.NEXT_PUBLIC_PIN_ENABLED = "true";
  try {
    assert.equal(await readSessionFromRequest(req(t)), null);
  } finally {
    process.env.NEXT_PUBLIC_PIN_ENABLED = "false";
  }
});

test("request: loopback only — refused when nginx's X-Real-IP is present", async () => {
  const t = await mintActingAsToken(await payload(), SECRET);
  assert.equal(
    await readSessionFromRequest(req(t, { headers: { "x-real-ip": "203.0.113.9" } })),
    null
  );
  // Next.js adds X-Forwarded-For itself on direct calls, so it must NOT refuse.
  const t2 = await mintActingAsToken(await payload(), SECRET);
  assert.equal(
    (
      await readSessionFromRequest(
        req(t2, { headers: { "x-forwarded-for": "127.0.0.1" } })
      )
    )?.shiftboardId,
    42
  );
});
