import type { Pool } from "mysql2/promise";

import {
  claimNextDue,
  isBounced,
  markDead,
  markSent,
  markTransientFailure,
  recentSentCount,
} from "./queue";
import type { QueueStore } from "./types";

// Production QueueStore backed by the shared MySQL pool. The worker
// only knows about this interface, so tests can drop in an in-memory
// store with no DB dependency.
export function createMysqlStore(pool: Pool): QueueStore {
  return {
    claimNextDue: () => claimNextDue(pool),
    markSent: (id) => markSent(pool, id),
    markTransientFailure: (id, attempts, reason) =>
      markTransientFailure(pool, id, attempts, reason),
    markDead: (id, reason) => markDead(pool, id, reason),
    isBounced: (to) => isBounced(pool, to),
    recentSentCount: (s) => recentSentCount(pool, s),
  };
}
