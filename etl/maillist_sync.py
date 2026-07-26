#!/usr/bin/env python3
"""Mailing-list generator: keep the Census_Email_lists Google Sheet current.

Replaces the legacy generator that (a) ran off stale data and (b) wrote a
literal, unsubstituted `$year` group name. This is the "new generator" — a
regular cron job on the prod ETL box.

What it does, idempotently, each run:
  1. Figure out the current burn year Y from op_dates, and the burn anchors:
       - gates-open Sunday  = Labor Day(Y) - 8 days
       - "burn end"         = Labor Day(Y) + 7 days (one week after close)
     (Labor Day = first Monday of September.)
  2. Compute who SHOULD be on each list from the prod DB:
       - CensusVolunteers{Y}@  : anyone with a shift dated in
         [burn_end(Y-1), burn_end(Y)] (op_volunteer_shifts). All op_ shifts
         are the current event, so in practice this is every current signup.
       - CensusNewVolunteers@  : anyone whose first-seen (MIN sb_pinfo.valid_from)
         falls in [gates_open(Y-1), gates_open(Y)] — i.e. joined the census team
         since last burn.
     (The general CensusVolunteers@ list is rolled over manually — not touched.)
  3. Read the sheet, dedupe against rows already present for that group (by
     shiftboard_id OR email), and append a PENDING row (done blank) for anyone
     missing. A human-in-the-loop processes pending rows into the actual Google
     Groups — writing the sheet does not email anyone.

Run:
    cd ~/census-etl && source venv/bin/activate
    python maillist_sync.py --dry-run   # report what would be added
    python maillist_sync.py             # append the pending rows
"""

from __future__ import annotations

import argparse
import datetime as dt
import logging
import os
import sys
from pathlib import Path

import gspread
import pymysql
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / "secrets" / "etl.env")

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
log = logging.getLogger("maillist_sync")

NEW_GROUP = "CensusNewVolunteers@burningman.org"
ADD_FUNC = "add_emails_to_groups"
SHEET_TAB = "Sheet1"


def get_db() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=os.environ["MYSQL_HOST"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
        ssl={"ssl": {}},
        autocommit=False,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def labor_day(year: int) -> dt.date:
    """First Monday of September."""
    d = dt.date(year, 9, 1)
    return d + dt.timedelta(days=(0 - d.weekday()) % 7)  # Monday == 0


def gates_open(year: int) -> dt.date:
    return labor_day(year) - dt.timedelta(days=8)  # gates-open Sunday


def burn_end(year: int) -> dt.date:
    return labor_day(year) + dt.timedelta(days=7)  # one week after close


def current_burn_year(db) -> int:
    with db.cursor() as cur:
        cur.execute("SELECT MAX(YEAR(`date`)) AS y FROM op_dates")
        return int(cur.fetchone()["y"])


def volunteers_with_shift(db, start: dt.date, end: dt.date) -> dict[str, str]:
    """{shiftboard_id: email} with a shift dated in [start, end], from EITHER the
    app (op_volunteer_shifts) OR Shiftboard (sb_shifts, populated by
    etl_sb_shifts). Covers Mew's "signed up in Shiftboard OR the app"."""
    out: dict[str, str] = {}
    with db.cursor() as cur:
        # app signups
        cur.execute(
            """
            SELECT DISTINCT v.shiftboard_id AS sb, LOWER(v.email) AS email
            FROM op_volunteer_shifts vs
            JOIN op_volunteers v ON v.shiftboard_id = vs.shiftboard_id
            JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
            JOIN op_shift_times st ON stp.shift_times_id = st.shift_times_id
            JOIN op_dates d ON st.start_date_id = d.date_id
            WHERE vs.remove_shift = 0 AND st.remove_shift_time = 0
              AND stp.remove_time_position = 0
              AND v.shiftboard_id > 0 AND v.delete_volunteer = 0
              AND v.email IS NOT NULL AND v.email <> ''
              AND d.`date` BETWEEN %s AND %s
            """,
            (start, end),
        )
        for r in cur.fetchall():
            out[str(r["sb"])] = r["email"]
        # Shiftboard signups (prefer the op_volunteers email if we have one)
        cur.execute(
            """
            SELECT DISTINCT s.shiftboard_id AS sb,
                   LOWER(COALESCE(NULLIF(v.email, ''), s.email)) AS email
            FROM sb_shifts s
            LEFT JOIN op_volunteers v
                   ON v.shiftboard_id = s.shiftboard_id AND v.delete_volunteer = 0
            WHERE s.shiftboard_id > 0
              AND s.`date` BETWEEN %s AND %s
              AND COALESCE(NULLIF(v.email, ''), s.email) <> ''
            """,
            (start, end),
        )
        for r in cur.fetchall():
            out.setdefault(str(r["sb"]), r["email"])  # don't clobber app email
    return out


def new_volunteers(db, since: dt.date) -> dict[str, str]:
    """{shiftboard_id: email} for new volunteers (Mew's definition):

    (A) added to the Census team in Shiftboard since last burn — detected as a
        sb_pinfo row with source='shiftboard_etl' AND no historical_seed row for
        that shiftboard_id (a genuinely new member, not an email-change re-version
        of a seeded one), whose first etl valid_from is >= `since`.
    (B) added to the app with an unknown shiftboard id — an op_volunteers row
        with no sb_pinfo profile at all (the okta callback generated a random id).

    NOTE: do NOT use MIN(valid_from) across all sources as a join date — most
    people have a single seeded row whose valid_from is a profile-snapshot date,
    not their join, which mislabels returning vets as new.
    """
    out: dict[str, str] = {}
    with db.cursor() as cur:
        # (A) new Shiftboard team members
        cur.execute(
            """
            SELECT e.shiftboard_id AS sb, LOWER(MIN(e.email)) AS email
            FROM sb_pinfo e
            WHERE e.source = 'shiftboard_etl'
              AND NOT EXISTS (
                SELECT 1 FROM sb_pinfo h
                WHERE h.shiftboard_id = e.shiftboard_id AND h.source = 'historical_seed'
              )
            GROUP BY e.shiftboard_id
            HAVING MIN(e.valid_from) >= %s AND MIN(e.email) IS NOT NULL AND MIN(e.email) <> ''
            """,
            (since,),
        )
        for r in cur.fetchall():
            out[str(r["sb"])] = r["email"]
        # (B) app-created with unknown shiftboard id
        cur.execute(
            """
            SELECT v.shiftboard_id AS sb, LOWER(v.email) AS email
            FROM op_volunteers v
            WHERE v.delete_volunteer = 0
              AND v.email IS NOT NULL AND v.email <> ''
              AND NOT EXISTS (SELECT 1 FROM sb_pinfo p WHERE p.shiftboard_id = v.shiftboard_id)
            """
        )
        for r in cur.fetchall():
            out.setdefault(str(r["sb"]), r["email"])
    return out


def open_sheet():
    cred_file = os.environ["GOOGLE_CREDENTIALS_FILE"]
    sheet_id = os.environ["MAILLIST_SHEET_ID"]
    creds = Credentials.from_service_account_file(
        cred_file, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    return gspread.authorize(creds).open_by_key(sheet_id).worksheet(SHEET_TAB)


def existing_membership(rows: list[list[str]]) -> dict[str, tuple[set[str], set[str]]]:
    """group -> (set of shiftboard_ids present, set of emails present)."""
    # header: Date, function, email, groupname, shiftboard, done
    by_group: dict[str, tuple[set[str], set[str]]] = {}
    for r in rows[1:]:
        if len(r) < 5:
            continue
        email, group, sb = r[2].strip().lower(), r[3].strip(), r[4].strip()
        sbs, ems = by_group.setdefault(group, (set(), set()))
        if sb:
            sbs.add(sb)
        if email:
            ems.add(email)
    return by_group


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report, don't write")
    args = ap.parse_args()

    db = get_db()
    try:
        year = current_burn_year(db)
        vol_group = f"CensusVolunteers{year}@burningman.org"
        vol_win = (burn_end(year - 1), burn_end(year))
        new_since = gates_open(year - 1)  # start of last year's burn
        log.info("burn year=%s | volunteers window=%s | new since=%s", year, vol_win, new_since)

        should = {
            vol_group: volunteers_with_shift(db, vol_win[0], vol_win[1]),
            NEW_GROUP: new_volunteers(db, new_since),
        }
    finally:
        db.close()

    ws = open_sheet()
    have = existing_membership(ws.get_all_values())

    now = dt.datetime.now().strftime("%B %-d, %Y at %I:%M%p")
    to_append: list[list[str]] = []
    for group, members in should.items():
        sbs, ems = have.get(group, (set(), set()))
        added = 0
        for sb, email in members.items():
            if sb in sbs or email in ems:
                continue
            to_append.append([now, ADD_FUNC, email, group, sb, ""])
            added += 1
        log.info("%s: should=%d already=%d to_add=%d", group, len(members), len(members) - added, added)

    if not to_append:
        log.info("nothing to add — sheet already current.")
        return 0

    if args.dry_run:
        log.info("DRY RUN — would append %d rows:", len(to_append))
        for row in to_append[:20]:
            log.info("  + %s -> %s (%s)", row[2], row[3], row[4])
        if len(to_append) > 20:
            log.info("  ... and %d more", len(to_append) - 20)
        return 0

    ws.append_rows(to_append, value_input_option="RAW")
    log.info("appended %d pending rows.", len(to_append))
    return 0


if __name__ == "__main__":
    sys.exit(main())
