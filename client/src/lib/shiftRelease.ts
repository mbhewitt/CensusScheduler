import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { enqueueEmail } from "lib/mail";
import { pool } from "lib/database";

// Shift release date (#869). Times are Pacific wall clock; the DB clock is UTC.
const NOW_PT = "CONVERT_TZ(NOW(), 'UTC', 'America/Los_Angeles')";

// For a shift row (aliases: st = op_shift_times, sn = op_shift_name): the Pacific
// time it opens if it's still embargoed, else NULL. Off-playa types are exempt.
// Used by /api/shifts (hide from non-admins) and checkShiftAdd (refuse
// non-admin sign-ups), so a direct link or Pumpkin can't get around it.
export const EMBARGOED_UNTIL_SQL = `(SELECT MAX(r.release_at)
  FROM op_shift_release r
  WHERE sn.off_playa = false
    AND DATE(st.start_time) >= r.embargo_from
    AND r.release_at > ${NOW_PT})`;

const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://volunteers.census.burningman.org";
const DISCORD_WEBHOOK_URL =
  process.env.SHIFT_RELEASE_DISCORD_WEBHOOK_URL?.trim() || null;
const LIST_EMAIL = process.env.SHIFT_RELEASE_LIST_EMAIL?.trim() || null;

// Announce each release once when it opens: a Discord post (webhook) and one
// email to the mailing list (Mew: the list, not per-person mail; the queue is
// capped at 150/day). Either channel is skipped when its env var is unset.
// Only releases that opened in the last day, so creating one in the past
// doesn't announce it.
async function announceDueReleases() {
  const [due] = await pool.query<RowDataPacket[]>(
    `SELECT release_id, YEAR(embargo_from) AS year
     FROM op_shift_release
     WHERE announced_at IS NULL
       AND release_at <= ${NOW_PT}
       AND release_at > ${NOW_PT} - INTERVAL 1 DAY`
  );
  for (const { release_id: id, year } of due) {
    const [claim] = await pool.query<ResultSetHeader>(
      "UPDATE op_shift_release SET announced_at = NOW() WHERE release_id = ? AND announced_at IS NULL",
      [id]
    );
    if (claim.affectedRows !== 1) continue;
    // ponytail: copy awaits Chipper's review (#869)
    const text = `${year} Black Rock City Census volunteer shifts are open for sign-up: ${APP_BASE_URL}/shifts`;
    if (DISCORD_WEBHOOK_URL) {
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          body: JSON.stringify({ content: text }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch (err) {
        console.error(`[shift-release] Discord post failed for ${id}:`, err);
      }
    }
    if (LIST_EMAIL) {
      try {
        await enqueueEmail({
          bodyText: text,
          category: "shift-release",
          subject: `${year} Census volunteer shifts are open`,
          to: LIST_EMAIL,
        });
      } catch (err) {
        console.error(`[shift-release] list email failed for ${id}:`, err);
      }
    }
    console.info(
      `[shift-release] announced release ${id} (discord=${Boolean(DISCORD_WEBHOOK_URL)} list=${Boolean(LIST_EMAIL)})`
    );
  }
}

export function startShiftReleaseAnnouncer() {
  setInterval(() => {
    announceDueReleases().catch((err) =>
      console.error("[shift-release] check failed:", err)
    );
  }, 60_000).unref();
}
