import { NextApiRequest, NextApiResponse } from "next";
import type { ResultSetHeader } from "mysql2";

import type { IReqContact } from "@/components/types/contact";
import { CONTACT_APP_FEEDBACK_LABEL, CONTACT_RECIPIENTS } from "@/constants";
import { enqueueEmail } from "lib/mail";
import { pool } from "lib/database";

// #app-feedback: App Help/Feedback submissions also post to a Discord channel
// webhook (URL is a secret — env only, never committed) so the app-feedback
// group sees them live. Redacted: header + a "Tablet app feedback ID"
// (= op_messages.id) + the message only — never the sender's name/contact.
const APP_FEEDBACK_WEBHOOK = process.env.APP_FEEDBACK_DISCORD_WEBHOOK;

const postAppFeedbackToDiscord = async (
  feedbackId: number,
  message: string
): Promise<void> => {
  if (!APP_FEEDBACK_WEBHOOK) {
    console.warn(
      `[contact] APP_FEEDBACK_DISCORD_WEBHOOK unset; skipping Discord post for feedback #${feedbackId}`
    );
    return;
  }
  const env =
    process.env.NEXT_PUBLIC_PIN_ENABLED !== "false" ? "on playa" : "online";
  const when = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const header =
    `App feedback sent from the Contact form ${env} at ${when}.\n` +
    `Tablet app feedback ID #${feedbackId}\n\n`;
  // Discord hard-caps content at 2000 chars — truncate the message if needed.
  const room = 2000 - header.length - 3;
  const body = message.length > room ? `${message.slice(0, room)}...` : message;
  try {
    const res = await fetch(APP_FEEDBACK_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: header + body }),
    });
    if (!res.ok) {
      console.error(
        `[contact] Discord webhook ${res.status} for feedback #${feedbackId}`
      );
    }
  } catch (err) {
    console.error(
      `[contact] Discord webhook post failed for feedback #${feedbackId}:`,
      err
    );
  }
};

// #312: the form was a black hole — `op_messages` row written, no email
// sent. Now we also enqueue the email via #307. The DB write is still
// the canonical "we got your message" — an enqueue failure logs but
// does not fail the form submission.
//
// The "to" field arriving from the form is a recipient *label*
// (e.g. "Volunteer Coordinator"), not an email address. We store the
// label in op_messages.to (human-readable history) and map it through
// CONTACT_RECIPIENTS to get the actual address list for the SMTP send.
// "Send me a reminder" is a self-reminder marker with no SMTP target —
// we skip the enqueue and just keep the op_messages row.
const buildSubject = (name: string, wantsReply: boolean): string =>
  `[Census contact] from ${name || "Anonymous"} (${wantsReply ? "reply wanted" : "no reply needed"})`;

const buildBody = (
  { email, isReplyWanted, message, name, to }: IReqContact,
  messageId: number
): string => {
  const lines = [
    `From: ${name || "Anonymous"} <${email}>`,
    `Routed to category: ${to}`,
    `Wants reply: ${isReplyWanted ? "yes" : "no"}`,
  ];
  // App feedback: surface the shared ID so the email and the Discord post line up.
  if (to === CONTACT_APP_FEEDBACK_LABEL) {
    lines.push(`Tablet app feedback ID #${messageId}`);
  }
  lines.push("", "--- Message ---", message, "", `Stored as op_messages.id = ${messageId}`);
  return lines.join("\n");
};

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      // store message
      const body: IReqContact = JSON.parse(req.body);
      const { email, isReplyWanted, message, name, to } = body;

      const [result] = await pool.query<ResultSetHeader>(
        // must use backticks for "to" keyword
        "INSERT INTO op_messages (email, message, name, `to`, wants_reply) VALUES (?, ?, ?, ?, ?)",
        [email, message, name, to, isReplyWanted]
      );

      // App feedback also posts to the #app-feedback Discord webhook (redacted).
      // Best-effort — a webhook failure must not fail the form submission.
      if (to === CONTACT_APP_FEEDBACK_LABEL) {
        await postAppFeedbackToDiscord(result.insertId, message);
      }

      // Best-effort send. Per #312 acceptance: enqueue failure does
      // NOT fail the form submission — the row write above is the
      // canonical record. Headers per the domain-admin contract:
      // From locked to census@burningmail.burningman.org (default in
      // enqueueEmail), Reply-To = volunteer's email, Cc = VC list.
      const recipientEmails = CONTACT_RECIPIENTS[to];
      if (!recipientEmails) {
        // "Send me a reminder" or an unknown label — no SMTP target.
        console.warn(
          `[contact] no email target for to=${JSON.stringify(to)} (op_messages.id=${result.insertId}); skipping enqueue`
        );
      } else {
        try {
          await enqueueEmail({
            to: recipientEmails,
            cc: "censusvc@burningman.org",
            replyTo: email,
            subject: buildSubject(name, isReplyWanted),
            bodyText: buildBody(body, result.insertId),
            category: "contact-form",
          });
        } catch (err) {
          console.error(
            `[contact] enqueueEmail failed for op_messages.id=${result.insertId}:`,
            err
          );
        }
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Created",
      });
    }

    // default
    // ------------------------------------------------------------
    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default contact;
