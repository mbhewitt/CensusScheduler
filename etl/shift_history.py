#!/usr/bin/env python3
"""Load the permanent shift history, op_shift_history (#759, Mew 2026-10-18).

One row per volunteer per shift worked. Three loads, each idempotent (upsert on
source + source_id + shiftboard_id), so re-running is safe:

  legacy     the legacy Census `shiftboard2` table (2006-2025) plus its ratings
             (`review_notes`). Reads from a LEGACY_MYSQL_* database, because
             shiftboard2 is not on prod RDS. Skips unfilled slots (id 0).
  sb-shifts  prod `sb_shifts` rows that shiftboard2 doesn't have (later
             Shiftboard pulls). Same Shiftboard signup id, so no double count.
  app        one season of the op_ tables (active signups), with ratings/notes.
             Run once the season is over, before the op_ tables move on.

Run (target = MYSQL_* in secrets/etl.env, as for the other ETL scripts):
    python shift_history.py legacy --dry-run
    python shift_history.py legacy
    python shift_history.py sb-shifts
    python shift_history.py app --year 2026
    python shift_history.py selftest
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
load_dotenv(HERE / "secrets" / "etl.env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
log = logging.getLogger("shift_history")

# Legacy subject_category.category -> today's op_shift_category.department.
DEPARTMENT_MAP = {"ConDecon": "SetupStrike", "ITTech": "Tech"}

COLUMNS = (
    "source, source_id, shiftboard_id, year, start_time, end_time, shift_name, "
    "position, department, off_playa, noshow, rating, notes"
)
UPSERT = f"""
    INSERT INTO op_shift_history ({COLUMNS})
    VALUES ({", ".join(["%s"] * 13)})
    ON DUPLICATE KEY UPDATE
        year=VALUES(year), start_time=VALUES(start_time), end_time=VALUES(end_time),
        shift_name=VALUES(shift_name), position=VALUES(position),
        department=VALUES(department), off_playa=VALUES(off_playa),
        noshow=VALUES(noshow), rating=VALUES(rating), notes=VALUES(notes)
"""


def connect(prefix: str, ssl: bool) -> pymysql.connections.Connection:
    return pymysql.connect(
        host=os.environ[f"{prefix}HOST"],
        port=int(os.environ.get(f"{prefix}PORT", "3306")),
        user=os.environ[f"{prefix}USER"],
        password=os.environ[f"{prefix}PASSWORD"],
        database=os.environ[f"{prefix}DATABASE"],
        ssl={"ssl": {}} if ssl else None,
        autocommit=False,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def target() -> pymysql.connections.Connection:
    return connect("MYSQL_", ssl=os.environ.get("MYSQL_SSL", "1") != "0")


def parse_span(day: dt.date, text: str | None) -> tuple[dt.datetime, dt.datetime | None]:
    """'14:00 - 18:00' or '2:00PM - 6:00PM' on `day` -> (start, end).

    An end before the start is past midnight. Unparseable -> (midnight, None).
    """
    midnight = dt.datetime.combine(day, dt.time())
    parts = [p.strip().upper() for p in (text or "").split("-")]
    if len(parts) != 2:
        return midnight, None
    times = []
    for part in parts:
        for fmt in ("%H:%M", "%I:%M%p", "%I:%M %p"):
            try:
                times.append(dt.datetime.strptime(part, fmt).time())
                break
            except ValueError:
                pass
    if len(times) != 2:
        return midnight, None
    start = dt.datetime.combine(day, times[0])
    end = dt.datetime.combine(day, times[1])
    return start, end + dt.timedelta(days=1) if end < start else end


def load_legacy() -> list[tuple]:
    src = connect("LEGACY_MYSQL_", ssl=os.environ.get("LEGACY_MYSQL_SSL", "0") == "1")
    with src.cursor() as cur:
        cur.execute(
            """
            SELECT s.id, s.shiftboard_id, s.date, s.shift, s.subject,
                   NULLIF(s.role, '') AS role, s.noshow, c.category, c.offPlaya,
                   r.score, NULLIF(r.notes, '') AS notes
            FROM shiftboard2 s
            LEFT JOIN subject_category c ON c.subject = s.subject
            LEFT JOIN review_notes r
              ON r.shift_id = s.id AND r.shiftboard_id = s.shiftboard_id
            WHERE s.shiftboard_id > 0
            """
        )
        rows = cur.fetchall()
    src.close()
    out = []
    for r in rows:
        # Not dateshift: a few "place holder for hours worked" rows carry a
        # dateshift years off their date.
        start, end = parse_span(r["date"], r["shift"])
        out.append((
            "shiftboard2", r["id"], r["shiftboard_id"], r["date"].year, start, end,
            r["subject"] or "?", r["role"],
            DEPARTMENT_MAP.get(r["category"], r["category"]),
            None if r["offPlaya"] is None else bool(int(r["offPlaya"] or 0)),
            r["noshow"] or "", r["score"], r["notes"],
        ))
    log.info("legacy: %d filled signups, %d with a rating",
             len(out), sum(1 for o in out if o[11] is not None))
    return out


def load_sb_shifts(db) -> list[tuple]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT sb_shift_id, shiftboard_id, `date`, shift, subject, noshow
            FROM sb_shifts
            WHERE shiftboard_id > 0
              AND sb_shift_id NOT IN (
                SELECT source_id FROM op_shift_history WHERE source = 'shiftboard2')
            """
        )
        rows = cur.fetchall()
    out = []
    for r in rows:
        start, end = parse_span(r["date"], r["shift"])
        out.append((
            "sb_shifts", r["sb_shift_id"], r["shiftboard_id"], r["date"].year, start, end,
            r["subject"] or "?", None, None, None, r["noshow"] or "", None, None,
        ))
    log.info("sb-shifts: %d signups not already in shiftboard2", len(out))
    return out


def load_app(db, year: int) -> list[tuple]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT tp.time_position_id, vs.shiftboard_id,
                   CAST(st.start_time AS DATETIME) AS start_time,
                   CAST(st.end_time AS DATETIME) AS end_time,
                   sn.shift_name, COALESCE(NULLIF(tp.position_alias, ''), pt.position) AS position,
                   c.department, sn.off_playa, vs.noshow, vs.rating,
                   NULLIF(vs.notes, '') AS notes
            FROM op_volunteer_shifts vs
            JOIN op_shift_time_position tp
              ON tp.time_position_id = vs.time_position_id AND tp.remove_time_position = false
            JOIN op_shift_times st
              ON st.shift_times_id = tp.shift_times_id AND st.remove_shift_time = false
            JOIN op_shift_name sn ON sn.shift_name_id = st.shift_name_id
            LEFT JOIN op_shift_category c ON c.shift_category_id = sn.shift_category_id
            LEFT JOIN op_position_type pt ON pt.position_type_id = tp.position_type_id
            WHERE vs.remove_shift = false AND vs.shiftboard_id > 0
              AND YEAR(CAST(st.start_time AS DATETIME)) = %s
            """,
            (year,),
        )
        rows = cur.fetchall()
    out = [(
        "app", r["time_position_id"], r["shiftboard_id"], year, r["start_time"],
        r["end_time"], r["shift_name"], r["position"], r["department"],
        bool(r["off_playa"]), r["noshow"] or "", r["rating"], r["notes"],
    ) for r in rows]
    log.info("app %d: %d active signups, %d rated", year, len(out),
             sum(1 for o in out if o[11] is not None))
    return out


def selftest() -> None:
    d = dt.date(2025, 8, 30)
    assert parse_span(d, "14:00 - 18:00") == (
        dt.datetime(2025, 8, 30, 14), dt.datetime(2025, 8, 30, 18))
    assert parse_span(d, "2:00PM - 6:00PM") == (
        dt.datetime(2025, 8, 30, 14), dt.datetime(2025, 8, 30, 18))
    assert parse_span(d, "22:00 - 02:00")[1] == dt.datetime(2025, 8, 31, 2)
    assert parse_span(d, "11:00AM - 3:00PM")[1] == dt.datetime(2025, 8, 30, 15)
    assert parse_span(d, "TBD") == (dt.datetime(2025, 8, 30), None)
    assert parse_span(d, None) == (dt.datetime(2025, 8, 30), None)
    print("selftest ok")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("load", choices=["legacy", "sb-shifts", "app", "selftest"])
    ap.add_argument("--year", type=int, help="season for `app`")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.load == "selftest":
        selftest()
        return 0
    if args.load == "app" and not args.year:
        ap.error("app needs --year")

    db = target()
    try:
        if args.load == "legacy":
            rows = load_legacy()
        elif args.load == "sb-shifts":
            rows = load_sb_shifts(db)
        else:
            rows = load_app(db, args.year)
        if args.dry_run:
            log.info("DRY RUN: would upsert %d rows", len(rows))
            return 0
        with db.cursor() as cur:
            cur.executemany(UPSERT, rows)
        db.commit()
        log.info("upserted %d rows", len(rows))
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
