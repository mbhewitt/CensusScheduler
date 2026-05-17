import mysql from "mysql2";

// MYSQL_SSL=true enables TLS for hosted DBs like RDS that require secure
// transport. Local docker DB on test/playa boxes leaves it unset.
const sslOption = process.env.MYSQL_SSL ? { ssl: "Amazon RDS" } : {};

// Pool wedge avoidance — observed on prod 2026-05-13 and 2026-05-17:
// after a few days the pool starts returning ETIMEDOUT on every query
// even though a fresh mysql.createConnection() to the same host works.
// Root cause: mysql2's idle-connection reaper only runs when
// maxIdle < connectionLimit (see lib/base/pool.js constructor). With
// the defaults, idle pool sockets sit forever and eventually get killed
// server-side by RDS wait_timeout (8h default). mysql2 hands those dead
// sockets back out on the next query — ETIMEDOUT.
//
//   maxIdle: 5            — strictly less than connectionLimit so the
//                           reaper actually runs.
//   idleTimeout: 60_000   — kill idle sockets after 60s. Well under any
//                           RDS / NAT / LB idle window we'd plausibly hit.
//   enableKeepAlive: true — default in mysql2 3.x, made explicit so the
//                           intent is obvious in code review.
//   keepAliveInitialDelay: 10_000
//                         — first TCP keep-alive probe after 10s of
//                           socket inactivity. Default 0 falls back to
//                           the OS default (Linux: 2h before first
//                           probe), which is too late to surface a
//                           dead connection before the next query.

export const pool = mysql
  .createPool({
    connectionLimit: 10,
    database: process.env.MYSQL_DATABASE,
    enableKeepAlive: true,
    host: process.env.MYSQL_HOST,
    idleTimeout: 60_000,
    keepAliveInitialDelay: 10_000,
    maxIdle: 5,
    password: process.env.MYSQL_PASSWORD,
    user: process.env.MYSQL_USER,
    ...sslOption,
  })
  .promise();
