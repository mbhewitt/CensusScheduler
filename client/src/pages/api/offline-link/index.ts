import type { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { withAuth } from "@/lib/withAuth";
import { pool } from "lib/database";
import { enqueueEmail } from "lib/mail";

// POST /api/offline-link — #643 (folds in #630).
//
// On the offline on-playa build external links (Hive, Discord, Burner
// Profile, Google Groups) are dead. Instead of a broken link, OfflineLink
// lets a signed-in volunteer email the link to themselves so they can follow
// it once they're back online. We queue the mail via op_email_queue (#307);
// the worker drains it when connectivity returns.
//
// Auth: withAuth gives us the signed-in shiftboard_id. The volunteer's email
// may be blank on the test server / for some records — in that case we do NOT
// enqueue; we return { queued: false, hasEmail: false } so the client can
// tell the volunteer to just type the URL manually (which is also shown).
const offlineLink = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: { shiftboardId: number }
) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ statusCode: 405, message: "Method not allowed" });
  }

  const { label, url }: { label?: string; url?: string } = JSON.parse(
    req.body || "{}"
  );
  if (!url || typeof url !== "string") {
    return res.status(400).json({ statusCode: 400, message: "Missing url" });
  }
  // Only email real off-site destinations — never let this be used to mail an
  // arbitrary local/relative path or a non-http(s) scheme.
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ statusCode: 400, message: "Invalid url" });
  }

  const linkLabel = (label || "this link").toString().slice(0, 200);

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT email FROM op_volunteers WHERE shiftboard_id = ?",
    [session.shiftboardId]
  );
  const email: string | null = rows[0]?.email || null;
  if (!email) {
    // No address on file — nothing to send. The client already shows the URL
    // to type manually, so this is a graceful "we can't email you" signal.
    return res
      .status(200)
      .json({ statusCode: 200, queued: false, hasEmail: false });
  }

  const { id } = await enqueueEmail({
    to: email,
    recipientShiftboardId: session.shiftboardId,
    subject: `Census: ${linkLabel}`,
    bodyText:
      `You asked the Census Lab tablet to send you this link:\n\n` +
      `${linkLabel}\n${url}\n\n` +
      `The tablets on playa have no internet, so open this once you're back ` +
      `online.`,
    category: "offline-link",
  });

  return res
    .status(200)
    .json({ statusCode: 200, queued: true, hasEmail: true, emailId: id });
};

export default withAuth(offlineLink);
