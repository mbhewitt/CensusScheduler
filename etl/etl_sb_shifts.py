#!/usr/bin/env python3
"""ETL: pull Shiftboard shift signups (coverage report) into prod `sb_shifts`.

Why: the CensusScheduler app (op_volunteer_shifts) is not the only place shifts
get signed up — several 2026 shifts went straight into Shiftboard. The
mailing-list generator needs those too, so CensusVolunteers{year}@ reflects
"signed up for a shift in Shiftboard OR the app".

Date strategy (per Mew 2026-07-26): a one-time --catchup pulls from the start of
last year's burn forward; the regular cron then follows the old censusload.php
pattern — a rolling window of roughly ±4 months around now.

The refresh is scoped: within the pulled date window we delete+reinsert the
`shiftboard`-source rows (so cancellations in-window drop out), but never touch
rows outside the window or `seed`-source rows (off-playa activity that isn't
actually in Shiftboard, seeded separately). Idempotent.

Run:
    cd ~/census-etl && source venv/bin/activate
    python etl_sb_shifts.py --catchup            # from last burn -> now+4mo
    python etl_sb_shifts.py --dry-run            # rolling window, report only
    python etl_sb_shifts.py                      # rolling window, apply
"""

from __future__ import annotations

import argparse
import datetime as dt
import logging
import os
import sys
from pathlib import Path

import pymysql
from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
load_dotenv(HERE / "secrets" / "etl.env")

from shiftboard_client import ShiftboardClient  # noqa: E402

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
log = logging.getLogger("etl_sb_shifts")

FOUR_MONTHS = dt.timedelta(days=4 * 30)  # matches censusload.php's 4*30*24*60*60


def get_db() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=os.environ["MYSQL_HOST"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
        ssl={"ssl": {}},
        autocommit=False,
        charset="utf8mb4",
    )


DDL = """
CREATE TABLE IF NOT EXISTS sb_shifts (
    sb_shift_id   BIGINT PRIMARY KEY,
    shiftboard_id BIGINT NOT NULL,
    `date`        DATE NOT NULL,
    subject       VARCHAR(128),
    shift         VARCHAR(64),
    event_code    VARCHAR(64),
    email         VARCHAR(255),
    noshow        VARCHAR(10),
    source        ENUM('shiftboard','seed') NOT NULL DEFAULT 'shiftboard',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_sb (shiftboard_id),
    KEY idx_date (`date`)
)
"""


def labor_day(year: int) -> dt.date:
    d = dt.date(year, 9, 1)
    return d + dt.timedelta(days=(0 - d.weekday()) % 7)


def gates_open(year: int) -> dt.date:
    return labor_day(year) - dt.timedelta(days=8)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--catchup", action="store_true", help="pull from last burn start")
    ap.add_argument("--today", help="override 'now' as YYYY-MM-DD (testing)")
    args = ap.parse_args()

    today = dt.date.fromisoformat(args.today) if args.today else dt.date.today()
    if args.catchup:
        start = gates_open(today.year - 1) if today.month < 9 else gates_open(today.year)
        end = today + FOUR_MONTHS
    else:  # old censusload.php rolling window: now ± 4 months
        start = today - FOUR_MONTHS
        end = today + FOUR_MONTHS
    log.info("coverage window: %s -> %s (catchup=%s)", start, end, args.catchup)

    client = ShiftboardClient(
        os.environ["SHIFTBOARD_USER"],
        os.environ["SHIFTBOARD_PASSWORD"],
        os.environ.get("SHIFTBOARD_SESSION_ID", "534228"),
    )
    if not client.authenticate():
        log.error("Shiftboard auth failed")
        return 1

    rows = client.download_coverage(start.isoformat(), end.isoformat())
    # keep filled signups with a usable shift id
    good = [
        r for r in rows
        if r["shiftboard_id"].isdigit() and int(r["shiftboard_id"]) > 0
        and r["sb_shift_id"].isdigit()
    ]
    log.info("coverage rows=%d usable=%d distinct_sb=%d",
             len(rows), len(good), len({r["shiftboard_id"] for r in good}))

    if args.dry_run:
        log.info("DRY RUN — would refresh shiftboard rows in [%s, %s] with %d signups",
                 start, end, len(good))
        return 0

    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(DDL)
            # refresh window: drop shiftboard-source rows in range, reinsert.
            cur.execute(
                "DELETE FROM sb_shifts WHERE source='shiftboard' AND `date` BETWEEN %s AND %s",
                (start, end),
            )
            ins = """
                INSERT INTO sb_shifts
                    (sb_shift_id, shiftboard_id, `date`, subject, shift, event_code, email, noshow, source)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'shiftboard')
                ON DUPLICATE KEY UPDATE
                    shiftboard_id=VALUES(shiftboard_id), `date`=VALUES(`date`),
                    subject=VALUES(subject), shift=VALUES(shift),
                    event_code=VALUES(event_code), email=VALUES(email),
                    noshow=VALUES(noshow), source='shiftboard'
            """
            cur.executemany(ins, [
                (int(r["sb_shift_id"]), int(r["shiftboard_id"]), r["date"],
                 r["subject"], r["shift"], r["event_code"], r["email"], r["noshow"])
                for r in good
            ])
        db.commit()
        log.info("sb_shifts refreshed: %d shiftboard signups in window", len(good))
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
