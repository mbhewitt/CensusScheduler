# Prod ETL scripts

Python scripts that run on the prod EC2 box (under `mew` user) to keep the prod RDS in sync with Shiftboard.

## Layout on prod
```
/home/mew/census-etl/
  venv/                          # python 3.13 venv (httpx, pymysql, openpyxl, python-dotenv)
  shiftboard_client.py           # standalone Shiftboard auth + profile download/parse
  etl_sb_pinfo.py                # Phase 2: SCD2 upsert into prod RDS sb_pinfo
  secrets/etl.env                # SHIFTBOARD_* + MYSQL_* (chmod 600, gitignored)
```

## Cron
`crontab -l` (mew):
```
# Census prod RDS -> OnPlayaData snapshot (every 4 hours)
0 */4 * * * cd $HOME/Census/OnPlayaData && server/update_server_v2.sh >> $HOME/onplayadata-dump.log 2>&1

# Census prod RDS sb_pinfo upsert from Shiftboard (every 4h, offset 2h)
0 2-22/4 * * * cd $HOME/census-etl && venv/bin/python etl_sb_pinfo.py >> $HOME/etl-sb-pinfo.log 2>&1
```

## What's done
- **Phase 1**: `sb_pinfo` SCD2 table on prod RDS, seeded from `CensusData/data/sql/shiftboard_pinfohis.sql`. Okta callback looks up by email -> canonical `shiftboard_id` (see `client/src/pages/api/auth/okta/callback.ts`, step 3).
- **Phase 2**: `etl_sb_pinfo.py` cron, every 4h. Pulls profiles for Active Census Team (597584) + Intake (602158), dedupes by `shiftboard_id`, SCD2-upserts into `sb_pinfo`.

## Mailing-list generator (`maillist_sync.py`)
Keeps the **Census_Email_lists** Google Sheet current (replaces the legacy
generator, which ran off stale data and wrote a literal, unsubstituted
`$year` group name). Cron on prod: `35 2-22/4 * * *` (after `etl_sb_pinfo`, so
`sb_pinfo` is fresh). Idempotent — appends only new **pending** rows (`done`
blank); a human-in-the-loop processes pending rows into the actual Google
Groups, so running this never emails anyone.

Each run computes, from the prod DB, who should be on each list and appends the
missing (deduped against rows already in the sheet, by shiftboard_id or email):
- **CensusVolunteers{year}@** — anyone with a shift dated in the burn-end→burn-end
  window `[LaborDay(Y-1)+7, LaborDay(Y)+7]`, from EITHER the app
  (`op_volunteer_shifts`) OR Shiftboard (`sb_shifts`, see below). Year and
  anchors are derived dynamically (Labor Day = first Monday of September; gates
  open = LaborDay−8), so no more `$year`.
- **CensusNewVolunteers@** — a *new volunteer* is EITHER **(A)** added to the
  Census team in Shiftboard since last burn — a `sb_pinfo` row with
  `source='shiftboard_etl'` and **no** `historical_seed` row for that
  shiftboard_id (a genuinely new member, not an email-change re-version), first
  seen ≥ start of last burn — OR **(B)** added to the app with an unknown
  shiftboard id — an `op_volunteers` row with **no** `sb_pinfo` profile (the
  okta callback generated a random id). Do NOT use `sb_pinfo.valid_from` as a
  join date; it's a profile-snapshot date for most people and mislabels vets.
  (The general `CensusVolunteers@` list is rolled over manually — not touched.)

Coverage gap: the prod ETL began 2026-05-31, so Shiftboard team-adds between
last burn and the seed are indistinguishable in `sb_pinfo` — signal (A) only
catches post-seed joins. Going forward it's complete; only the initial backfill
misses that window (accepted, per Mew).

Extra env (`secrets/etl.env`) + deps beyond Phase 2: `MAILLIST_SHEET_ID`,
`GOOGLE_CREDENTIALS_FILE` (path to the `vccensus@…` service-account JSON, which
must be shared as Editor on the sheet); `pip install gspread google-auth`.

## Shiftboard shifts ETL (`etl_sb_shifts.py`)
Pulls the Shiftboard **coverage report** (shift signups) into a prod `sb_shifts`
table, so the mailing-list generator counts shifts signed up directly in
Shiftboard as well as in the app. Cron: `25 2-22/4 * * *` (before `maillist_sync`).

- `shiftboard_client.download_coverage(start, end)` GETs
  `report.cgi?type=coverage&…&format=tab_delimited&download=Download` (the
  `download=Download` and `YYYYMMDD` dates are both required — dashes or omitting
  download silently return an HTML page / 0 rows) and parses the TSV.
- Dates (per Mew): one-time `--catchup` pulls from the start of last year's burn;
  the cron then uses the old `censusload.php` rolling window of ±4 months.
- Within the pulled window it deletes + reinserts `source='shiftboard'` rows
  (so in-window cancellations drop out) but never touches rows outside the window
  or `source='seed'` rows — reserved for off-playa activity that isn't actually
  in Shiftboard, if seeded from the legacy `shiftboard2`.

Manual: `python etl_sb_shifts.py --catchup` / `--dry-run` / (no args = rolling apply).

## What's not
- **Phase 3** (intake / welcome workflow): not started. Needs:
  - port of `Intake()` from `VCcensus/src/censusload.php`
  - calls into `add_member_to_census()` / `remove_member_from_intake()` already stubbed in `shiftboard_client.py`
  - welcome email send (decide on Gmail API vs SMTP first)
  - integration with `op_volunteers` (currently legacy code wrote to `shiftboard_pinfo`)

## Running manually
```
cd ~/census-etl
source venv/bin/activate
python etl_sb_pinfo.py --dry-run    # report changes, don't write
python etl_sb_pinfo.py              # apply
python etl_sb_pinfo.py --group 597584   # single-group only
```
