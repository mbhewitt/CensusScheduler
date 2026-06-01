#!/usr/bin/env python3
"""Phase 2 ETL: pull current Shiftboard profile data, upsert into sb_pinfo.

What this does:
    1. Authenticate with Shiftboard (read creds from env).
    2. Download current profiles from the Active Census Team group (597584)
       and the Intake group (602158). Both feed sb_pinfo so we capture
       new arrivals' emails even before they're moved to the team.
    3. For each (shiftboard_id, email):
         - If no row exists for that shiftboard_id      -> INSERT new (current).
         - If current row exists with same email        -> no-op.
         - If current row exists with a different email -> close it out
                                                           (valid_to=NOW())
                                                           and INSERT a new
                                                           current row.

Idempotent. Safe to run repeatedly.

Run:
    cd ~/census-etl
    source venv/bin/activate
    python etl_sb_pinfo.py            # apply changes
    python etl_sb_pinfo.py --dry-run  # report what would change, don't write
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import pymysql
from dotenv import load_dotenv

# When called from cron the cwd is $HOME, so anchor to this file's directory.
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
load_dotenv(HERE / "secrets" / "etl.env")

from shiftboard_client import (  # noqa: E402
    CENSUS_TEAM_GROUP,
    INTAKE_GROUP,
    ShiftboardClient,
    ShiftboardError,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("etl_sb_pinfo")


@dataclass
class Counts:
    fetched: int = 0
    inserted: int = 0
    closed_then_inserted: int = 0
    unchanged: int = 0
    skipped_no_email: int = 0
    errors: int = 0

    def __str__(self) -> str:
        return (
            f"fetched={self.fetched} inserted={self.inserted} "
            f"changed={self.closed_then_inserted} unchanged={self.unchanged} "
            f"skipped_no_email={self.skipped_no_email} errors={self.errors}"
        )


def get_db() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=os.environ["MYSQL_HOST"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
        ssl={"ssl": {}},  # RDS requires TLS; empty dict = default verify
        autocommit=False,
        charset="utf8mb4",
    )


def upsert_sb_pinfo(
    db: pymysql.connections.Connection,
    shiftboard_id: int,
    email: str,
    dry_run: bool,
    counts: Counts,
) -> None:
    """SCD2 upsert for a single (shiftboard_id, email) observation."""
    with db.cursor(pymysql.cursors.DictCursor) as cur:
        cur.execute(
            "SELECT id, email FROM sb_pinfo "
            "WHERE shiftboard_id=%s AND valid_to IS NULL "
            "ORDER BY valid_from DESC LIMIT 1",
            (shiftboard_id,),
        )
        current = cur.fetchone()

        if current is None:
            log.debug("INSERT new sb_pinfo id=%s email=%s", shiftboard_id, email)
            if not dry_run:
                cur.execute(
                    "INSERT INTO sb_pinfo "
                    "(shiftboard_id, email, valid_from, valid_to, source) "
                    "VALUES (%s, %s, NOW(), NULL, 'shiftboard_etl')",
                    (shiftboard_id, email),
                )
            counts.inserted += 1
            return

        if current["email"].lower() == email.lower():
            counts.unchanged += 1
            return

        log.info(
            "CHANGE shiftboard_id=%s: %s -> %s",
            shiftboard_id, current["email"], email,
        )
        if not dry_run:
            now = datetime.utcnow()
            cur.execute(
                "UPDATE sb_pinfo SET valid_to=%s WHERE id=%s",
                (now, current["id"]),
            )
            cur.execute(
                "INSERT INTO sb_pinfo "
                "(shiftboard_id, email, valid_from, valid_to, source) "
                "VALUES (%s, %s, %s, NULL, 'shiftboard_etl')",
                (shiftboard_id, email, now),
            )
        counts.closed_then_inserted += 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Shiftboard -> sb_pinfo ETL")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="report what would change, do not write to RDS",
    )
    parser.add_argument(
        "--group",
        type=int,
        default=None,
        help="single group ID to pull; default = both Census Team + Intake",
    )
    args = parser.parse_args()

    counts = Counts()

    user = os.environ.get("SHIFTBOARD_USER")
    pw = os.environ.get("SHIFTBOARD_PASSWORD")
    ss = os.environ.get("SHIFTBOARD_SESSION_ID", "534228")
    if not user or not pw:
        log.error("SHIFTBOARD_USER / SHIFTBOARD_PASSWORD missing from env")
        return 2

    client = ShiftboardClient(user, pw, ss)
    log.info("authenticating to Shiftboard as %s", user)
    if not client.authenticate():
        log.error("Shiftboard authentication failed")
        return 3

    group_ids = [args.group] if args.group else [CENSUS_TEAM_GROUP, INTAKE_GROUP]

    # Collect first, dedupe by shiftboard_id (last write wins, so a person
    # who appears in both Census Team and Intake takes the Intake row --
    # intake tends to have the newer profile data).
    pairs: dict[int, str] = {}
    for gid in group_ids:
        log.info("downloading profiles for group %s", gid)
        try:
            profiles = client.download_profiles(gid)
        except ShiftboardError as e:
            log.error("download failed for group %s: %s", gid, e)
            counts.errors += 1
            continue
        log.info("group %s returned %d profile rows", gid, len(profiles))
        for p in profiles:
            counts.fetched += 1
            if not p.get("email"):
                counts.skipped_no_email += 1
                continue
            pairs[p["shiftboard_id"]] = p["email"]
    log.info("after dedupe: %d distinct shiftboard_ids to upsert", len(pairs))

    db = get_db()
    try:
        for sb_id, email in pairs.items():
            try:
                upsert_sb_pinfo(db, sb_id, email, args.dry_run, counts)
            except Exception as e:
                log.exception(
                    "upsert failed for shiftboard_id=%s email=%s: %s",
                    sb_id, email, e,
                )
                counts.errors += 1

        if not args.dry_run:
            db.commit()
            log.info("committed: %s", counts)
        else:
            db.rollback()
            log.info("DRY RUN, rolled back: %s", counts)
    finally:
        db.close()

    return 0 if counts.errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
