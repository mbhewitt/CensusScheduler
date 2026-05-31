import { createFreshConnection, drainPool, pool } from "./database";

// DB wedge detector. Every `DB_HEALTHCHECK_INTERVAL_MS` (default 60s)
// we run `SELECT 1` through the pool with a tight timeout. On failure
// we run the same query via a one-shot fresh connection.
//
//   pool OK          → healthy, nothing to do.
//   pool FAIL,
//     fresh OK       → POOL WEDGE. Log + drain idle pool connections
//                      so subsequent queries get fresh sockets that
//                      re-resolve DNS through cacheable-lookup.
//                      Continue logging at every tick until pool
//                      recovers (so a still-active wedge is visible
//                      in `docker logs` and any webhook channel).
//   pool FAIL,
//     fresh FAIL     → DB UNREACHABLE. Log only — we can't fix it
//                      from the app.
//
// Notifications:
//   - Every state transition writes a recognizable marker to
//     stderr (`[db:healthcheck:state=...]`). External watchers can
//     grep / tail.
//   - If `DB_WEDGE_WEBHOOK_URL` is set, the same payload is POSTed
//     there (Discord-/Slack-compatible). Best-effort; webhook failures
//     are logged but don't stop the heartbeat.

const WEBHOOK_URL = process.env.DB_WEDGE_WEBHOOK_URL?.trim() || null;
const PING_TIMEOUT_MS = 5_000;
const HEARTBEAT_INTERVAL_MS = (() => {
  const raw = process.env.DB_HEALTHCHECK_INTERVAL_MS;
  if (!raw) return 60_000;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 5_000 ? n : 60_000;
})();

type State = "healthy" | "wedged" | "unreachable" | "boot";
let state: State = "boot";
let consecutiveWedgeTicks = 0;
let timer: NodeJS.Timeout | null = null;

async function pingViaPool(): Promise<boolean> {
  try {
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("pool ping timeout")),
          PING_TIMEOUT_MS
        )
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function pingViaFreshConnection(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try {
        conn.destroy();
      } catch {
        // best-effort
      }
      resolve(ok);
    };
    const conn = createFreshConnection();
    const timeout = setTimeout(() => finish(false), PING_TIMEOUT_MS + 1_000);
    conn.connect((connErr) => {
      if (connErr) {
        clearTimeout(timeout);
        finish(false);
        return;
      }
      conn.query("SELECT 1", (qErr) => {
        clearTimeout(timeout);
        finish(!qErr);
      });
    });
  });
}

async function postWebhook(payload: object): Promise<void> {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(5_000),
    });
  } catch (err) {
    console.warn("[db:healthcheck] webhook POST failed:", err);
  }
}

function logState(transition: { from: State; to: State; detail?: string }) {
  const stamp = new Date().toISOString();
  console.warn(
    `[db:healthcheck:state=${transition.to}] from=${transition.from} consecutive_wedge_ticks=${consecutiveWedgeTicks} ${transition.detail ?? ""}`
  );
  void postWebhook({
    consecutive_wedge_ticks: consecutiveWedgeTicks,
    detail: transition.detail ?? "",
    event: "db_state_change",
    from: transition.from,
    timestamp: stamp,
    to: transition.to,
  });
}

export async function tickHealthCheck(): Promise<{
  poolOk: boolean;
  freshOk: boolean | null;
  state: State;
}> {
  const poolOk = await pingViaPool();
  if (poolOk) {
    if (state !== "healthy") {
      const previous = state;
      state = "healthy";
      consecutiveWedgeTicks = 0;
      logState({ from: previous, to: "healthy" });
    }
    return { freshOk: null, poolOk: true, state };
  }
  const freshOk = await pingViaFreshConnection();
  if (freshOk) {
    consecutiveWedgeTicks++;
    if (state !== "wedged") {
      const previous = state;
      state = "wedged";
      logState({
        detail: "pool query failed but fresh connection succeeded",
        from: previous,
        to: "wedged",
      });
    } else {
      // Still wedged. Surface so a long wedge is visible at every tick.
      console.warn(
        `[db:healthcheck:state=wedged] ongoing consecutive_wedge_ticks=${consecutiveWedgeTicks}`
      );
    }
    // Auto-recovery: destroy idle pool sockets so subsequent queries
    // borrow fresh ones (which re-resolve DNS through cacheable-lookup).
    // Safe — wedged sockets aren't doing useful work anyway.
    try {
      await drainPool();
    } catch (err) {
      console.error("[db:healthcheck] drainPool failed:", err);
    }
    return { freshOk: true, poolOk: false, state };
  }
  if (state !== "unreachable") {
    const previous = state;
    state = "unreachable";
    logState({
      detail: "both pool and fresh connection failed",
      from: previous,
      to: "unreachable",
    });
  } else {
    console.warn(
      `[db:healthcheck:state=unreachable] ongoing both ping paths still failing`
    );
  }
  return { freshOk: false, poolOk: false, state };
}

export function startDbHealthCheck(): { stop: () => void } {
  if (timer) {
    // already running — bootstrap is idempotent
    return { stop: () => stopDbHealthCheck() };
  }
  const tick = async () => {
    try {
      await tickHealthCheck();
    } catch (err) {
      console.error("[db:healthcheck] tick error:", err);
    } finally {
      if (timer) timer = setTimeout(tick, HEARTBEAT_INTERVAL_MS);
    }
  };
  // Defer the first tick so app boot doesn't race against the pool warmup.
  timer = setTimeout(tick, HEARTBEAT_INTERVAL_MS);
  timer.unref?.();
  console.warn(
    `[db:healthcheck] started — intervalMs=${HEARTBEAT_INTERVAL_MS} webhook=${WEBHOOK_URL ? "yes" : "no"}`
  );
  return { stop: () => stopDbHealthCheck() };
}

export function stopDbHealthCheck(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
