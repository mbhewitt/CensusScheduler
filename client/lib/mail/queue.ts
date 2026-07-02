import type { Pool } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { nextAttemptDelaySeconds } from "./backoff";
import type { EmailRow, EnqueueArgs, MailConfig } from "./types";

// Kept local to the mail layer so queue.ts has no dep on src/constants.ts
// (which is React-side). Must stay in sync with
// ROLE_EMAIL_UNSUBSCRIBED_ID in client/src/constants.ts and the seed in
// migrations/003_email_unsubscribed_role.sql.
const ROLE_EMAIL_UNSUBSCRIBED_ID = 2000020;

const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://volunteers.census.burningman.org";

function joinAddrs(v: string | string[] | undefined): string | null {
  if (v === undefined) return null;
  if (Array.isArray(v)) return v.join(", ");
  return v;
}

async function isUnsubscribed(
  pool: Pool,
  shiftboardId: number
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1
       FROM op_volunteer_roles
      WHERE shiftboard_id = ?
        AND role_id = ?
        AND add_role = true
        AND remove_role = false
      LIMIT 1`,
    [shiftboardId, ROLE_EMAIL_UNSUBSCRIBED_ID]
  );
  return rows.length > 0;
}

function appendUnsubscribeFooter(
  bodyText: string,
  bodyHtml: string | undefined,
  unsubscribeUrl: string
): { bodyText: string; bodyHtml: string | undefined } {
  const text = `${bodyText}\n\n— — —\nDon't want these emails? Click here to unsubscribe:\n${unsubscribeUrl}\n`;
  const html =
    bodyHtml === undefined
      ? undefined
      : `${bodyHtml}\n<hr>\n<p style="color:#666;font-size:12px;">Don't want these emails? <a href="${unsubscribeUrl}">Click here to unsubscribe</a>.</p>`;
  return { bodyText: text, bodyHtml: html };
}

export async function enqueueEmail(
  pool: Pool,
  config: MailConfig,
  args: EnqueueArgs
): Promise<{ id: number; skipped?: boolean }> {
  const to = joinAddrs(args.to);
  if (!to) throw new Error("enqueueEmail: `to` is required");

  let bodyText = args.bodyText;
  let bodyHtml = args.bodyHtml;

  if (args.recipientShiftboardId != null) {
    if (await isUnsubscribed(pool, args.recipientShiftboardId)) {
      return { id: 0, skipped: true };
    }
    const unsubUrl = `${APP_BASE_URL}/unsubscribe`;
    ({ bodyText, bodyHtml } = appendUnsubscribeFooter(
      bodyText,
      bodyHtml,
      unsubUrl
    ));
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO op_email_queue
      (\`to\`, cc, reply_to, \`from\`, subject, body_text, body_html,
       ics_attachment, ics_filename, attachment, attachment_filename, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      to,
      joinAddrs(args.cc),
      args.replyTo ?? config.defaultReplyTo,
      config.from,
      args.subject,
      bodyText,
      bodyHtml ?? null,
      args.ics?.content ?? null,
      args.ics?.filename ?? null,
      args.attachment?.content ?? null,
      args.attachment?.filename ?? null,
      args.category,
    ]
  );
  return { id: result.insertId };
}

interface QueueRowPacket extends RowDataPacket {
  id: number;
  to: string;
  cc: string | null;
  reply_to: string;
  from: string;
  subject: string;
  body_text: string;
  body_html: string | null;
  ics_attachment: Buffer | null;
  ics_filename: string | null;
  attachment: Buffer | null;
  attachment_filename: string | null;
  category: string;
  attempts: number;
  state: EmailRow["state"];
}

// Pick the oldest due `queued` row and atomically flip it to `sending`.
// Returns null when nothing is due.
//
// Atomicity: relies on a transaction with FOR UPDATE so two worker ticks
// (e.g. across multi-instance deployment, or overlapping ticks if a send
// runs longer than the interval) can't grab the same row twice. The
// per-tick lock window is tiny — just the SELECT + UPDATE round-trip.
export async function claimNextDue(pool: Pool): Promise<EmailRow | null> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<QueueRowPacket[]>(
      `SELECT id, \`to\`, cc, reply_to, \`from\`, subject, body_text, body_html,
              ics_attachment, ics_filename, attachment, attachment_filename,
              category, attempts, state
         FROM op_email_queue
        WHERE state = 'queued' AND next_attempt_at <= NOW()
        ORDER BY next_attempt_at ASC, id ASC
        LIMIT 1
        FOR UPDATE`
    );
    if (rows.length === 0) {
      await conn.commit();
      return null;
    }
    const r = rows[0];
    await conn.execute(`UPDATE op_email_queue SET state='sending' WHERE id=?`, [
      r.id,
    ]);
    await conn.commit();
    return {
      id: r.id,
      to: r.to,
      cc: r.cc,
      replyTo: r.reply_to,
      from: r.from,
      subject: r.subject,
      bodyText: r.body_text,
      bodyHtml: r.body_html,
      ics:
        r.ics_attachment && r.ics_filename
          ? { filename: r.ics_filename, content: r.ics_attachment }
          : null,
      attachment:
        r.attachment && r.attachment_filename
          ? { filename: r.attachment_filename, content: r.attachment }
          : null,
      category: r.category,
      attempts: r.attempts,
      state: r.state,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function markSent(pool: Pool, id: number): Promise<void> {
  await pool.execute(
    `UPDATE op_email_queue
        SET state='sent', sent_at=NOW(), attempts=attempts+1, last_error=NULL
      WHERE id=?`,
    [id]
  );
}

export async function markTransientFailure(
  pool: Pool,
  id: number,
  attempts: number,
  reason: string
): Promise<void> {
  const delay = nextAttemptDelaySeconds(attempts + 1);
  await pool.execute(
    `UPDATE op_email_queue
        SET state='queued',
            attempts=attempts+1,
            next_attempt_at=DATE_ADD(NOW(), INTERVAL ? SECOND),
            last_error=?
      WHERE id=?`,
    [delay, reason, id]
  );
}

export async function markDead(
  pool: Pool,
  id: number,
  reason: string
): Promise<void> {
  await pool.execute(
    `UPDATE op_email_queue
        SET state='dead', attempts=attempts+1, last_error=?
      WHERE id=?`,
    [reason, id]
  );
}

interface CountPacket extends RowDataPacket {
  n: number;
}

export async function recentSentCount(
  pool: Pool,
  withinSeconds: number
): Promise<number> {
  const [rows] = await pool.execute<CountPacket[]>(
    `SELECT COUNT(*) AS n
       FROM op_email_queue
      WHERE state='sent' AND sent_at > DATE_SUB(NOW(), INTERVAL ? SECOND)`,
    [withinSeconds]
  );
  return rows[0]?.n ?? 0;
}
