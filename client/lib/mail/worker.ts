import type { MailConfig, QueueStore, Transport } from "./types";

// Run a single tick. Exported so a CLI smoke test (or future Lambda
// trigger) can drive the worker manually without depending on the
// in-process setInterval.
//
// Behavior:
//   - Rate-limit check first; if exceeded, no-op.
//   - Atomically claim the oldest due row (transitions to `sending`).
//   - Hand to transport.
//   - On success: mark sent.
//   - On transient failure: requeue with backoff.
//   - On permanent failure: mark dead.
//
// Returns true iff a row was processed (sent OR failed). The worker loop
// uses this to drain quickly when the queue is backed up.
export async function tickOnce(
  store: QueueStore,
  config: MailConfig,
  transport: Transport
): Promise<boolean> {
  const sentLastMinute = await store.recentSentCount(60);
  if (sentLastMinute >= config.ratePerMinute) return false;

  const sentLast24h = await store.recentSentCount(24 * 3600);
  if (sentLast24h >= config.ratePerDay) return false;

  const row = await store.claimNextDue();
  if (!row) return false;

  const result = await transport.send(row);
  if (result.ok) {
    await store.markSent(row.id);
    return true;
  }

  if (result.permanent) {
    await store.markDead(row.id, result.error ?? "unknown permanent error");
  } else {
    await store.markTransientFailure(
      row.id,
      row.attempts,
      result.error ?? "unknown transient error"
    );
  }
  return true;
}

// Long-running drain loop. setTimeout-based so a slow tick can't stack;
// each tick is awaited before the next is scheduled.
export function startWorker(
  store: QueueStore,
  config: MailConfig,
  transport: Transport
): { stop: () => void } {
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const run = async () => {
    if (stopped) return;
    try {
      // Drain bursts: keep ticking while work is found, up to the
      // rate-limit. tickOnce returns true while it has work to do.
      let did = await tickOnce(store, config, transport);
      while (did && !stopped) {
        did = await tickOnce(store, config, transport);
      }
    } catch (err) {
      console.error("[mail:worker] tick error:", err);
    } finally {
      if (!stopped) timer = setTimeout(run, config.workerTickMs);
    }
  };

  // Defer the first tick so app boot doesn't block on it.
  timer = setTimeout(run, config.workerTickMs);

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
