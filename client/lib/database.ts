import CacheableLookup from "cacheable-lookup";
import mysql from "mysql2";

// MYSQL_SSL=true enables TLS for hosted DBs like RDS that require secure
// transport. Local docker DB on test/playa boxes leaves it unset.
const sslOption = process.env.MYSQL_SSL ? { ssl: "Amazon RDS" } : {};

// DNS re-resolution. Root cause of the recurring pool wedge (2026-05-13,
// 17, 23, 31): Node's libuv `dns.lookup()` caches its first result for
// the lifetime of the process. When AWS RDS does a Multi-AZ failover or
// endpoint refresh, the cached IP keeps pointing at the dead instance.
// Every new mysql2 connection — even the "fresh" one from the retry
// wrapper below — SYNs the dead IP and times out. Meanwhile the host's
// `mysql` CLI does a fresh `getaddrinfo` per invocation, hits the new
// IP, and works fine. Container restart "fixes" it because the new
// Node process starts with an empty cache.
//
// cacheable-lookup honors the DNS record's TTL (default RDS endpoints
// are ~5 s on the CNAME). 60 s maxTtl is a belt — even if the upstream
// TTL is mis-advertised we still re-resolve every minute.
const dnsLookup = new CacheableLookup({ maxTtl: 60, errorTtl: 5 });

// dateStrings: return DATE/DATETIME columns as "YYYY-MM-DD" strings instead of
// JS Date objects pinned to UTC midnight. Without this, a DATE value like
// 2026-08-25 arrives as 2026-08-25T00:00:00Z and dayjs renders it in the
// browser's local zone — west-of-UTC browsers see Aug 24, and re-saving writes
// the shifted day back to the DB.

// Pool wedge avoidance — observed on prod 2026-05-13, 2026-05-17, 2026-05-23:
// after some time the pool starts returning ETIMEDOUT on every query even
// though a fresh mysql.createConnection() to the same host works. Root
// cause confirmed 2026-05-23: keepalive IS armed on the underlying TCP
// sockets, but Linux's default keepalive retry params (`tcp_keepalive_intvl
// = 75s, tcp_keepalive_probes = 9`) mean a dead connection stays in the
// pool ~11 minutes before the kernel declares it dead. Queries routed to
// such a dead connection time out with ETIMEDOUT.
//
//   maxIdle: 5            — strictly less than connectionLimit so the
//                           idle-connection reaper actually runs
//                           (lib/base/pool.js gates on this inequality).
//   idleTimeout: 60_000   — reaper destroys idle sockets after 60s.
//   enableKeepAlive: true + keepAliveInitialDelay: 10_000
//                         — first TCP keep-alive probe after 10s; without
//                           this Linux waits 2h before the first probe.
//
// These three together drop the death-window from "11 min after the
// connection silently dies" to "11 min, IF the connection went dead at
// 0s of idle time AND the reaper missed it within 60s". Not zero, hence
// the retry wrapper below.

// mysql2's typings don't expose `lookup`, but it forwards unknown
// options to the underlying net.createConnection / tls.connect, both
// of which honor `lookup` per Node's docs. Type assertion is local
// to this construction.
const basePool = mysql
  .createPool({
    connectionLimit: 10,
    database: process.env.MYSQL_DATABASE,
    dateStrings: true,
    enableKeepAlive: true,
    host: process.env.MYSQL_HOST,
    idleTimeout: 60_000,
    keepAliveInitialDelay: 10_000,
    lookup: dnsLookup.lookup,
    maxIdle: 5,
    password: process.env.MYSQL_PASSWORD,
    user: process.env.MYSQL_USER,
    ...sslOption,
  } as unknown as mysql.PoolOptions)
  .promise();

// Retry-once-on-ETIMEDOUT wrapper for pool.query / pool.execute.
//
// When the pool hands out a connection that AWS has silently killed
// (per the comment above), the first .query() returns ETIMEDOUT after
// ~10s. The connection is then removed from the pool (mysql2 destroys
// failed connections), so a retry borrows a different — almost
// certainly alive — one. Cap retries at 1 so a true outage still
// surfaces quickly rather than thrashing.
//
// Implementation note: monkey-patches the pool's .query / .execute
// methods rather than exporting a separate function so we don't have
// to touch every callsite in the codebase. Existing callers (every
// `pool.query(sql, params)`) get the retry transparently.

const ETIMEDOUT_RETRYABLE = new Set(["ETIMEDOUT", "PROTOCOL_CONNECTION_LOST"]);

function isRetryableConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && ETIMEDOUT_RETRYABLE.has(code);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapWithRetry<T extends (...args: any[]) => Promise<any>>(
  label: string,
  original: T
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    try {
      return await original(...args);
    } catch (err) {
      if (isRetryableConnectionError(err)) {
        const code = (err as { code?: string }).code;
        // single retry — if both fail, propagate the second error
        console.warn(
          `[db] ${label} got ${code}; retrying once with a fresh connection`
        );
        return await original(...args);
      }
      throw err;
    }
  }) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pq = basePool.query.bind(basePool) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pe = basePool.execute.bind(basePool) as any;
basePool.query = wrapWithRetry("pool.query", pq);
basePool.execute = wrapWithRetry("pool.execute", pe);

export const pool = basePool;

// One-shot connection that bypasses the pool. Used by the wedge
// heartbeat (lib/dbHealth.ts) to distinguish "pool is wedged" from
// "DB itself is unreachable" — when those answers disagree we can
// trigger automatic pool drain instead of just logging and waiting.
export function createFreshConnection() {
  return mysql.createConnection({
    connectTimeout: 5_000,
    database: process.env.MYSQL_DATABASE,
    dateStrings: true,
    host: process.env.MYSQL_HOST,
    lookup: dnsLookup.lookup,
    password: process.env.MYSQL_PASSWORD,
    user: process.env.MYSQL_USER,
    ...sslOption,
  } as unknown as mysql.ConnectionOptions);
}

// Force every idle connection in the pool to be destroyed. The pool
// itself stays usable — subsequent queries borrow fresh sockets which
// re-resolve DNS through cacheable-lookup. Called by the heartbeat
// when it detects the wedge-vs-healthy-DB signature.
export async function drainPool(): Promise<void> {
  // mysql2's promise pool wraps the callback pool. The internal
  // ._allConnections is an array of connection objects (typed any
  // because mysql2 doesn't export the private shape). Destroying
  // an in-use connection terminates its current query — but if the
  // pool is wedged, every connection's current query is already
  // ETIMEDOUT-ing, so the user impact is nil.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = (basePool as any).pool;
  if (!internal) return;
  const all: { destroy?: () => void }[] = [
    ...(internal._allConnections?.toArray?.() ?? internal._allConnections ?? []),
  ];
  let destroyed = 0;
  for (const c of all) {
    try {
      c.destroy?.();
      destroyed++;
    } catch {
      // best effort
    }
  }
  console.warn(`[db] drainPool destroyed ${destroyed} pool connection(s)`);
}
