import { NextApiRequest, NextApiResponse } from "next";
import type { ResultSetHeader } from "mysql2";

import type { IReqContact } from "@/components/types/contact";
import { CONTACT_RECIPIENT } from "@/constants";
import { enqueueEmail } from "lib/mail";
import { pool } from "lib/database";

// #312: the form was a black hole — `op_messages` row written, no email
// sent. Now we also enqueue the email via #307. The DB write is still
// the canonical "we got your message" — an enqueue failure logs but
// does not fail the form submission.
//
// The Contact Us form routes to a single PEERS inbox. The "To" field is
// prepopulated and read-only on the client, so it always carries
// CONTACT_RECIPIENT; we store that in op_messages.to (history) and send
// the email to CONTACT_RECIPIENT regardless of the posted value.
const buildSubject = (name: string): string =>
  `[PEERS contact] from ${name || "Anonymous"}`;

const buildBody = (
  { email, message, name, to }: IReqContact,
  messageId: number
): string =>
  [
    `From: ${name || "Anonymous"} <${email}>`,
    `Routed to category: ${to}`,
    "",
    "--- Message ---",
    message,
    "",
    `Stored as op_messages.id = ${messageId}`,
  ].join("\n");

const contact = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      // store message
      const body: IReqContact = JSON.parse(req.body);
      const { email, message, name, to } = body;

      const [result] = await pool.query<ResultSetHeader>(
        // must use backticks for "to" keyword. wants_reply is retained as
        // a column but the form no longer collects it — always false.
        "INSERT INTO op_messages (email, message, name, `to`, wants_reply) VALUES (?, ?, ?, ?, ?)",
        [email, message, name, to, false]
      );

      // Best-effort send. Per #312 acceptance: enqueue failure does
      // NOT fail the form submission — the row write above is the
      // canonical record. Headers per the domain-admin contract:
      // From locked to peers@burningmail.burningman.org (default in
      // enqueueEmail), Reply-To = volunteer's email. No Cc — the form
      // only ever emails the single PEERS inbox.
      try {
        await enqueueEmail({
          to: CONTACT_RECIPIENT,
          replyTo: email,
          subject: buildSubject(name),
          bodyText: buildBody(body, result.insertId),
          category: "contact-form",
        });
      } catch (err) {
        console.error(
          `[contact] enqueueEmail failed for op_messages.id=${result.insertId}:`,
          err
        );
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
