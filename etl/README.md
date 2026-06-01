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
