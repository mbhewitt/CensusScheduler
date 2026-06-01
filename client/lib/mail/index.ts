import { pool } from "../database";

import { enqueueEmail as enqueueEmailRaw } from "./queue";
import { createMysqlStore } from "./store";
import { selectTransport } from "./transport";
import type { EnqueueArgs, MailConfig } from "./types";
import { startWorker } from "./worker";

function readConfig(): MailConfig {
  const port = parseInt(process.env.SMTP_PORT ?? "25", 10);
  return {
    from: process.env.MAIL_FROM ?? "census@burningmail.burningman.org",
    defaultReplyTo:
      process.env.MAIL_DEFAULT_REPLY_TO ??
      "Census Volunteer Coordinators <censusvc@burningman.org>",
    smtpHost: process.env.SMTP_HOST ?? "127.0.0.1",
    smtpPort: Number.isFinite(port) ? port : 25,
    dryRun: process.env.MAIL_DRY_RUN === "1",
    overrideTo: process.env.MAIL_OVERRIDE_TO?.trim() || null,
    workerDisabled: process.env.MAIL_WORKER_DISABLED === "1",
    ratePerMinute: parseIntEnv("MAIL_RATE_PER_MINUTE", 1),
    ratePerDay: parseIntEnv("MAIL_RATE_PER_DAY", 100),
    workerTickMs: parseIntEnv("MAIL_WORKER_TICK_MS", 30_000),
  };
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

let workerStarted = false;
let runtimeConfig: MailConfig | null = null;

function config(): MailConfig {
  if (!runtimeConfig) runtimeConfig = readConfig();
  return runtimeConfig;
}

export async function enqueueEmail(
  args: EnqueueArgs
): Promise<{ id: number; skipped?: boolean }> {
  return enqueueEmailRaw(pool, config(), args);
}

// Idempotent: instrumentation.ts calls this on cold start. Safe to call
// repeatedly — extra calls no-op.
export function bootstrapMailWorker(): void {
  if (workerStarted) return;
  const cfg = config();
  if (cfg.workerDisabled) {
    console.warn("[mail:worker] disabled via MAIL_WORKER_DISABLED=1");
    return;
  }
  workerStarted = true;
  const transport = selectTransport(cfg);
  const store = createMysqlStore(pool);
  startWorker(store, cfg, transport);
  console.warn(
    `[mail:worker] started — tickMs=${cfg.workerTickMs} ratePerMinute=${cfg.ratePerMinute} ratePerDay=${cfg.ratePerDay} dryRun=${cfg.dryRun} smtp=${cfg.smtpHost}:${cfg.smtpPort}${cfg.overrideTo ? ` overrideTo=${cfg.overrideTo}` : ""}`
  );
}
