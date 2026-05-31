import nodemailer from "nodemailer";

import { classifyError } from "./classify";
import type { EmailRow, MailConfig, SendResult, Transport } from "./types";

// Pull the METHOD value out of an .ics payload so we can hand the
// matching method to nodemailer's icalEvent (it goes into the
// Content-Type parameter on the text/calendar part). Defaults to
// PUBLISH for "I'm putting this on your calendar" — a safe fallback
// that calendar clients will accept even if the file itself was
// authored without an explicit METHOD line.
function extractIcsMethod(
  content: Buffer | string
): "publish" | "cancel" | "request" | "reply" | "add" | "refresh" {
  const s = Buffer.isBuffer(content) ? content.toString("utf8") : content;
  const m = s.match(/^METHOD:(\S+)/m);
  const v = (m?.[1] ?? "PUBLISH").toLowerCase();
  switch (v) {
    case "publish":
    case "cancel":
    case "request":
    case "reply":
    case "add":
    case "refresh":
      return v;
    default:
      return "publish";
  }
}

// When MAIL_OVERRIDE_TO is set, prefix the body so the test recipient
// can see at a glance what the real headers would have been.
function applyOverride(
  row: EmailRow,
  override: string
): {
  to: string;
  cc: string | null;
  bodyText: string;
  bodyHtml: string | null;
} {
  const banner = [
    "*** MAIL_OVERRIDE_TO is active — this would have gone to:",
    `***   To: ${row.to}`,
    ...(row.cc ? [`***   Cc: ${row.cc}`] : []),
    `***   Reply-To: ${row.replyTo}`,
    "*** Delivered to the override address instead.",
    "",
  ].join("\n");
  return {
    to: override,
    cc: null,
    bodyText: banner + row.bodyText,
    bodyHtml: row.bodyHtml
      ? `<pre style="background:#fff4cc;border:1px solid #d4a017;padding:8px;color:#5b3a00;">${banner.replace(/\n/g, "<br>")}</pre>${row.bodyHtml}`
      : null,
  };
}

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
        const headers = config.overrideTo
          ? applyOverride(row, config.overrideTo)
          : {
              to: row.to,
              cc: row.cc,
              bodyText: row.bodyText,
              bodyHtml: row.bodyHtml,
            };
        await transporter.sendMail({
          from: row.from,
          to: headers.to,
          cc: headers.cc ?? undefined,
          replyTo: row.replyTo,
          subject: row.subject,
          text: headers.bodyText,
          html: headers.bodyHtml ?? undefined,
          // Use nodemailer's `icalEvent` so the calendar payload lives
          // inside a multipart/alternative as text/calendar. Outlook
          // renders that as a native event banner ("Add to calendar")
          // instead of a passive file attachment. Apple Mail / Gmail
          // also recognize the inline part and surface the same UI.
          icalEvent: row.ics
            ? {
                filename: row.ics.filename,
                content: row.ics.content,
                method: extractIcsMethod(row.ics.content),
              }
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
