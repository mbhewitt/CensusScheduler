# Peers server setup — volunteers.peers.burningman.org

Prepared by Census bot at Mew's request (2026-06-12). Same app as
`volunteers.census.burningman.org`; this covers the peers-specific bits +
email + the stale-DB-pool handling Mew called out.

## 1. Credentials (`.env.production`)

`.env.production` is provided alongside this file. Copy it to
`client/.env.production` on the peers box and `chmod 600`.

It is identical to census prod **except**:
- `OKTA_REDIRECT_URI` → the peers host callback
- `APP_BASE_URL` → `https://volunteers.peers.burningman.org` (added)

### ⚠ Things to handle before it works
- **Okta whitelist (blocker for sign-in).** The callback
  `https://volunteers.peers.burningman.org/api/auth/okta/callback` must be
  added to the BM Okta app (client `0oaubvnw94GPFS5Lq5d7`) by BM IT, or Okta
  sign-in returns `redirect_uri_mismatch`. **Until it's whitelisted**, set
  `NEXT_PUBLIC_OKTA_ENABLED="false"` and `NEXT_PUBLIC_PIN_ENABLED="true"`
  (passcode sign-in), the same as the test droplet. `NEXT_PUBLIC_*` bake in
  at **build time** — rebuild after changing them.
- **Shared database.** These creds point at the **same prod census RDS**
  (`MYSQL_USER=census`, DB `census`). The peers app will read/write the
  **live census data**. If peers should have its own DB, change `MYSQL_*`.
- **Shared SESSION_SECRET.** Same secret as census prod → session cookies
  are interchangeable between the two deployments. Fine if intentional;
  rotate to a unique value if you want them isolated.

## 2. Deploy

Follow `PROD_DEPLOY.md` in the repo (it's the full runbook). Essentials:
- Use `docker-compose-prod.yaml` (app only — RDS, no sidecar DB). Always
  pass `--file docker-compose-prod.yaml`.
- **Swap is mandatory** on ≤2 GB boxes or the Next.js build OOMs silently.
- `MYSQL_SSL="true"` is required — RDS has `require_secure_transport=ON`.
- nginx reverse-proxies `127.0.0.1:3000`; certbot for TLS on the peers host.

## 3. Email

- The app runs an **in-process mail queue worker** (`client/lib/mail`). It
  sends via SMTP at `SMTP_HOST` — `host.docker.internal:25`, i.e. the **host
  box's MTA on port 25**. The compose maps `host.docker.internal` so the
  container can reach the host.
- So: an MTA (postfix/sendmail) must be listening on `:25` on the host and
  able to relay to the internet — **or** point `SMTP_HOST` at a real relay.
- Worker is rate-limited: `MAIL_RATE_PER_MINUTE` / `MAIL_RATE_PER_DAY`
  (defaults 1 / 100). Tune via env.
- Testing knobs: `MAIL_DRY_RUN=1` (queue but don't send),
  `MAIL_OVERRIDE_TO="you@example.com"` (redirect all mail to a test address).
- **On-playa caveat:** an offline box can't send — mail queues but never
  delivers until there's connectivity. Don't rely on email as a safety net
  for on-playa flows.

## 4. Stale DB handler (the pool-wedge issue)

Known issue: the mysql2 connection pool can go **stale / wedge after a few
days** (dead RDS connections the kernel hasn't reaped), and requests start
hanging. Restarting the container heals it; the proper fix is pool config.

Mitigations that should be present on the peers box (they're in the repo —
verify they're active):
- **`docker-compose-prod.yaml` sysctls** — `net.ipv4.tcp_keepalive_intvl=10`
  and `net.ipv4.tcp_keepalive_probes=3`, so dead TCP connections surface in
  ~30 s instead of Linux's default ~11 min.
- **`client/lib/database.ts`** sets `keepAliveInitialDelay` on the mysql2
  pool (pairs with the sysctls above).
- **`db:healthcheck`** runs every 60 s (you'll see `[db:healthcheck]
  started` in the logs).

Operational workaround if it still wedges:
```bash
docker compose --file docker-compose-prod.yaml up -d --force-recreate
# or: docker restart census-app
```

## 5. Verify (after deploy)
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/                 # 200
curl -s -o /dev/null -w "%{http_code}\n" https://volunteers.peers.burningman.org/  # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  https://volunteers.peers.burningman.org/api/auth/okta   # 302 -> login.burningman.org (once Okta is enabled+whitelisted)
```

## 6. Regular DB backup

Census's regular backup is a **cron'd `mysqldump` → versioned git snapshot**
(the `OnPlayaData` repo), running on the census prod box every 4 hours:

```cron
0 */4 * * * cd $HOME/Census/OnPlayaData && server/update_server_v2.sh >> $HOME/onplayadata-dump.log 2>&1
```

`server/update_server_v2.sh` dumps the `census` DB's `op_*` tables
(`mysqldump --single-transaction`) into two files it then `git commit && push`:
- `server/<YEAR>_on_playa_server_data_v2.sql` — data (+ a few admin/fixup rows
  appended for the on-playa load: passcode reset for shiftboard_id=1,
  SuperAdmin grants, etc.)
- `server/current_schema_v2.sql` — schema only

You get a **4-hourly, git-versioned snapshot history** — point-in-time restore
= check out an older commit and reload the `.sql`. The script also sed-splits
the INSERTs (one row per line) so row-level diffs stay readable in PR review.

**Gotcha it works around:** prod `~/.my.cnf` has a `database = census` line that
breaks `mysqldump` arg parsing on MariaDB. The script builds a clean auth-only
defaults file (`[client]` host/user/password from `~/.my.cnf`) and runs the
dump with `--defaults-file=` that temp file (chmod 600, removed on exit).

### For peers
- **If peers shares the census RDS** (the creds as shipped), the census cron
  above already backs up that exact data every 4h — **no separate backup
  needed**, it's the same database.
- **If peers uses its own DB**, replicate the cron: `mysqldump
  --single-transaction <db> <op_* tables>` on a 4-hour schedule, committed to a
  repo (or rotated to disk / S3). Easiest is to copy `OnPlayaData/server/` +
  `bin/get_year.sh` and point the auth cnf at the peers DB.
- **Baseline either way:** AWS RDS already does automated daily snapshots +
  point-in-time recovery (managed by AWS). The cron dump is the
  human-readable, git-diffable, restore-anywhere layer on top of that.
