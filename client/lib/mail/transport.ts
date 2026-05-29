import nodemailer from "nodemailer";

import { classifyError } from "./classify";
import type { EmailRow, MailConfig, SendResult, Transport } from "./types";

export function createSmtpTransport(config: MailConfig): Transport {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    // Local Exim on the prod EC2 box accepts unauthenticated submission
    // from localhost. No TLS required for the localhost hop — the upstream
    // SES relay handles TLS to the wider internet.
    tls: { rejectUnauthorized: false },
  });

  return {
    async send(row: EmailRow): Promise<SendResult> {
      try {
        await transporter.sendMail({
          from: row.from,
          to: row.to,
          cc: row.cc ?? undefined,
          replyTo: row.replyTo,
          subject: row.subject,
          text: row.bodyText,
          html: row.bodyHtml ?? undefined,
          attachments: row.ics
            ? [
                {
                  filename: row.ics.filename,
                  content: row.ics.content,
                  contentType: "text/calendar; method=REQUEST; charset=UTF-8",
                },
              ]
            : undefined,
        });
        return { ok: true };
      } catch (err) {
        const { permanent, reason } = classifyError(err);
        return { ok: false, permanent, error: reason };
      }
    },
  };
}

// Logs intent and reports success without touching the network.
// Used in dev/CI and on hosts that have no SMTP relay configured.
export function createDryRunTransport(): Transport {
  return {
    async send(row: EmailRow): Promise<SendResult> {
      console.warn(
        `[mail:dry-run] would send id=${row.id} to=<${row.to}> subject=${JSON.stringify(row.subject)} category=${row.category}`
      );
      return { ok: true };
    },
  };
}

export function selectTransport(config: MailConfig): Transport {
  if (config.dryRun) return createDryRunTransport();
  return createSmtpTransport(config);
}
