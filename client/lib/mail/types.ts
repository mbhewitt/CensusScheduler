export type EmailState = "queued" | "sending" | "sent" | "failed" | "dead";

export interface EnqueueArgs {
  to: string | string[];
  cc?: string | string[];
  replyTo?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  ics?: { filename: string; content: Buffer };
  category: string;
}

export interface EmailRow {
  id: number;
  to: string;
  cc: string | null;
  replyTo: string;
  from: string;
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  ics: { filename: string; content: Buffer } | null;
  category: string;
  attempts: number;
  state: EmailState;
}

export interface SendResult {
  ok: boolean;
  permanent?: boolean;
  error?: string;
}

export interface Transport {
  send(row: EmailRow): Promise<SendResult>;
}

// What the worker needs from the queue. Lets us back the worker by either
// the real MySQL queue (production) or an in-memory implementation (tests),
// without the worker holding a reference to a `Pool`.
export interface QueueStore {
  claimNextDue(): Promise<EmailRow | null>;
  markSent(id: number): Promise<void>;
  markTransientFailure(
    id: number,
    attempts: number,
    reason: string
  ): Promise<void>;
  markDead(id: number, reason: string): Promise<void>;
  recentSentCount(withinSeconds: number): Promise<number>;
}

export interface MailConfig {
  from: string;
  defaultReplyTo: string;
  smtpHost: string;
  smtpPort: number;
  dryRun: boolean;
  // When set: SMTP envelope + To header are rewritten to this single
  // address; Cc is dropped; the body is prepended with a banner showing
  // what the real recipients would have been. The queue row is NOT
  // modified — `op_email_queue.to` / `cc` still record the intended
  // recipients so routing logic stays observable. Unsetting the env
  // (and recreating the container) flips traffic back to live.
  overrideTo: string | null;
  workerDisabled: boolean;
  ratePerMinute: number;
  ratePerDay: number;
  workerTickMs: number;
}
