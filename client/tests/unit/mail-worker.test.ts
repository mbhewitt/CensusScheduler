import { strict as assert } from "node:assert";
import { test } from "node:test";

import type {
  EmailRow,
  MailConfig,
  QueueStore,
  SendResult,
  Transport,
} from "../../lib/mail/types";
import { tickOnce } from "../../lib/mail/worker";

const baseConfig: MailConfig = {
  from: "census@burningmail.burningman.org",
  defaultReplyTo: "Census Volunteer Coordinators <censusvc@burningman.org>",
  smtpHost: "127.0.0.1",
  smtpPort: 25,
  smtpSecure: false,
  smtpUser: null,
  smtpPass: null,
  dryRun: false,
  overrideTo: null,
  workerDisabled: false,
  ratePerMinute: 1,
  ratePerDay: 100,
  workerTickMs: 30_000,
};

function makeRow(overrides: Partial<EmailRow> = {}): EmailRow {
  return {
    id: 1,
    to: "mu@burningman.org",
    cc: null,
    replyTo: baseConfig.defaultReplyTo,
    from: baseConfig.from,
    subject: "Test",
    bodyText: "hi",
    bodyHtml: null,
    ics: null,
    attachment: null,
    category: "test",
    attempts: 0,
    state: "queued",
    ...overrides,
  };
}

function makeStore(opts: {
  row?: EmailRow | null;
  sentInLastMinute?: number;
  sentInLastDay?: number;
}): QueueStore & {
  calls: { sent: number[]; dead: Array<[number, string]>; failed: Array<[number, number, string]> };
} {
  const calls = {
    sent: [] as number[],
    dead: [] as Array<[number, string]>,
    failed: [] as Array<[number, number, string]>,
  };
  let row = opts.row ?? null;
  return {
    async claimNextDue() {
      const r = row;
      row = null;
      return r;
    },
    async markSent(id) {
      calls.sent.push(id);
    },
    async markTransientFailure(id, attempts, reason) {
      calls.failed.push([id, attempts, reason]);
    },
    async markDead(id, reason) {
      calls.dead.push([id, reason]);
    },
    async recentSentCount(within) {
      return within <= 60 ? (opts.sentInLastMinute ?? 0) : (opts.sentInLastDay ?? 0);
    },
    calls,
  };
}

function makeTransport(result: SendResult | (() => SendResult)): Transport {
  return {
    async send() {
      return typeof result === "function" ? result() : result;
    },
  };
}

test("tickOnce: success path marks sent", async () => {
  const store = makeStore({ row: makeRow() });
  const t = makeTransport({ ok: true });
  const did = await tickOnce(store, baseConfig, t);
  assert.equal(did, true);
  assert.deepEqual(store.calls.sent, [1]);
  assert.equal(store.calls.failed.length, 0);
  assert.equal(store.calls.dead.length, 0);
});

test("tickOnce: transient failure requeues", async () => {
  const store = makeStore({ row: makeRow({ attempts: 2 }) });
  const t = makeTransport({ ok: false, permanent: false, error: "timeout" });
  await tickOnce(store, baseConfig, t);
  assert.equal(store.calls.sent.length, 0);
  assert.deepEqual(store.calls.failed, [[1, 2, "timeout"]]);
  assert.equal(store.calls.dead.length, 0);
});

test("tickOnce: permanent failure marks dead", async () => {
  const store = makeStore({ row: makeRow() });
  const t = makeTransport({ ok: false, permanent: true, error: "550 user unknown" });
  await tickOnce(store, baseConfig, t);
  assert.equal(store.calls.sent.length, 0);
  assert.deepEqual(store.calls.dead, [[1, "550 user unknown"]]);
  assert.equal(store.calls.failed.length, 0);
});

test("tickOnce: per-minute cap skips work", async () => {
  // Already sent 1 in the last 60s. Cap is 1/min → don't send.
  const store = makeStore({ row: makeRow(), sentInLastMinute: 1 });
  const t = makeTransport({ ok: true });
  const did = await tickOnce(store, baseConfig, t);
  assert.equal(did, false);
  assert.equal(store.calls.sent.length, 0);
});

test("tickOnce: per-day cap skips work even when minute cap is fine", async () => {
  const store = makeStore({
    row: makeRow(),
    sentInLastMinute: 0,
    sentInLastDay: 100,
  });
  const t = makeTransport({ ok: true });
  const did = await tickOnce(store, baseConfig, t);
  assert.equal(did, false);
  assert.equal(store.calls.sent.length, 0);
});

test("tickOnce: no work → returns false", async () => {
  const store = makeStore({ row: null });
  const t = makeTransport({ ok: true });
  const did = await tickOnce(store, baseConfig, t);
  assert.equal(did, false);
});

test("tickOnce: missing error string uses fallback reason", async () => {
  const store = makeStore({ row: makeRow() });
  const t = makeTransport({ ok: false, permanent: false });
  await tickOnce(store, baseConfig, t);
  assert.equal(store.calls.failed[0][2], "unknown transient error");

  const store2 = makeStore({ row: makeRow({ id: 2 }) });
  const t2 = makeTransport({ ok: false, permanent: true });
  await tickOnce(store2, baseConfig, t2);
  assert.equal(store2.calls.dead[0][1], "unknown permanent error");
});
