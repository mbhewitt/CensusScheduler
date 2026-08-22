# On-Playa Ops & Cutover Runbook

How the CensusScheduler on-playa box (CensusLab, `192.168.11.11`) runs during
the event and how we cut over from **cloud-primary** to **on-playa-primary**.

Everything runs on the **single origin** `volunteers.census.burningman.org` —
there is no separate playa hostname. Which server that name resolves to is
controlled entirely by the on-playa **dnsmasq** (split-horizon DNS): before
cutover it points at the *true* AWS IP; after cutover it points at the local
box. The installed PWA and passcode sign-in follow the DNS, so the same app
"is" cloud before cutover and local after, with no reinstall.

> ✅ **Read-only mode is built** (PR #693): flip `CENSUS_READ_ONLY=true` +
> `CENSUS_READ_ONLY_MESSAGE=...` and restart the container. See
> [§Read-only mode](#read-only-mode-built--pr-693).

---

## Roles at a glance

| Phase | AWS prod (`volunteers.census...`) | On-playa box (`192.168.11.11`) | dnsmasq for `volunteers.census...` |
|---|---|---|---|
| Normal (now) | **primary, writable** | not deployed | (n/a — no playa network) |
| **1. Ops bring-up** | **primary, writable** | **secondary, READ-ONLY**, synced from prod every 15 min | → **true AWS IP** |
| **2. Cutover** | **READ-ONLY + banner** | **primary, writable** | → **192.168.11.11 (local)** |
| Post-event (optional) | re-primary | archived / decommissioned | remove playa network |

---

## Phase 0 — Prereqs (do at home, before playa)

1. **Device-secret / passcode feature** is merged (PR #691). Before it does
   anything on the shared origin: apply **migration `015_device_provisioning.sql`**
   to prod RDS, and build the app with `NEXT_PUBLIC_PIN_ENABLED=true`
   (see `PROD_DEPLOY.md`; get Mew's explicit go — this changes the prod login build).

2. **On-playa box HTTPS + real cert** (see [§On-playa HTTPS](#on-playa-https--cert)).
   Mandatory: PWA install + service worker + httpOnly cookies require a secure
   context, and plain HTTP to a LAN IP is not one. Copy the real Let's Encrypt
   cert for `volunteers.census.burningman.org` from AWS to the box.

3. **Provision the tablets** (super-admin → *Provision Tablet* → QR → scan on each
   tablet) and **install the PWA** on each. Do this while the box can reach the
   origin over HTTPS (either online, or on the playa network once dnsmasq +
   local HTTPS are up). A tablet is only trusted for passcode after it's scanned.

---

## Phase 1 — Ops bring-up (box is SECONDARY, read-only)

Goal: the on-playa box mirrors prod and is ready to take over, but **cannot be
written to** (so nobody makes changes that the next sync would silently discard).

1. **Bring the box up** with the playa compose (`docker-compose-playa.yaml`:
   app + database + dnsmasq). App serves HTTPS on the box (see §HTTPS).

2. **dnsmasq points the origin at the TRUE AWS IP.** In `dnsmasq/dnsmasq.conf`,
   add an explicit override ABOVE the catch-all so the real site is reachable:
   ```
   address=/volunteers.census.burningman.org/<AWS_PROD_IP>
   ```
   (plus any other domains the app/tablets need to reach the real internet —
   Okta `login.burningman.org`, etc.) Everything else still falls to
   `address=/#/192.168.11.11`.

3. **Box in READ-ONLY mode** (banner: *"Running at CensusLab — read-only mirror.
   Changes are made on the live site."*). See §Read-only mode.

4. **DB sync: box pulls the `OnPlayaData` git repo and restores the mysqldump,
   every 15 min.** This is the existing `census-deploy.sh` mechanism — the box
   does NOT dump prod RDS directly. Upstream, prod (and peers) periodically dump
   their DB and commit the fresh mysqldump to the `OnPlayaData` repo; the box
   `git pull`s it and restores it into the local `census-database` container
   (see `refresh_database()` in `census-deploy.sh`, which loads
   `OnPlayaData/server/${YEAR}_on_playa_server_data_v2.sql`).

   **Stagger the three machines' crons so no two hit GitHub (or dump) on the same
   minute** (per Mew — the *test box* `census-ops-test` is NOT in this set):

   | Machine | Cron minutes | Job |
   |---|---|---|
   | **Prod** (`volunteers.census.burningman.org`) | `0,15,30,45` | dump DB → commit/push to `OnPlayaData` |
   | **peers** (`volunteers.peers.burningman.org`) | `5,20,35,50` | peers' DB backup / its own git op |
   | **On-playa box** (CensusLab) | `2,17,32,47` | `git pull OnPlayaData` → restore mysqldump (runs just after prod's :00 push) |

   On-playa box crontab (per Mew 2026-08-21). The box is a **separate machine**
   at CensusLab (NOT the NucBox dev host); it's normally **off**, reachable via
   the **NordVPN meshnet** when powered on — `ssh census-ops` (alias in
   `~/.ssh/config`, meshnet `100.127.209.214`, user `mew`). Install in its crontab:
   ```
   2,17,32,47 * * * * /home/mew/Census/CensusScheduler/census-deploy.sh >> /home/mew/Census/CensusScheduler/deploy.log 2>&1
   ```

   The box's pull runs *after* the upstream pushes so it restores current data.
   Sync only runs while the box has uplink — it just no-ops offline. Keep it
   running from now until the end of Burning Man so the box is never >15 min stale.

   > **CONFIRM** prod's & peers' exact minutes against their real schedules; the
   > box is fixed at `2,17,32,47` and they just need to not collide with it.

5. **Box stays read-only** the whole time it's a mirror, so nobody makes a local
   change that the next `git pull` + restore would silently overwrite.

---

## Phase 2 — Cutover (box becomes PRIMARY)

Do this at the announced time (changes resume *"at CensusLab @ 6:30a"*). Order
matters — freeze prod first so no write is lost between the final sync and the
DNS flip.

1. **Put PROD into read-only mode + banner:**
   > *"Schedule changes can only be made at CensusLab (6:30a). You can sign in
   > and view your schedule, but changes are paused until then."*
   People can still log in and read; all writes are blocked. See §Read-only mode.

2. **Final DB sync:** ensure prod's last dump is committed to `OnPlayaData`, then
   run the box's `git pull` + restore once manually so the box has prod's final
   state. Then **stop the box's sync cron** (the box is about to be the source of
   truth — a further pull+restore would clobber local writes).

3. **Flip dnsmasq to local.** Remove the `volunteers.census.../<AWS_IP>` override
   so the name falls through the catch-all to the box:
   ```
   # (delete or comment) address=/volunteers.census.burningman.org/<AWS_PROD_IP>
   # now handled by: address=/#/192.168.11.11
   ```
   Restart dnsmasq. Tablets/PWAs now resolve the origin to `192.168.11.11`.
   Because the box serves the same origin with the copied real cert, the
   installed PWA keeps working — no reinstall, cookies intact.

4. **Take the box OUT of read-only** — it's now the writable primary. Drop its
   read-only banner.

5. **Start the on-playa DB dump cron.** Once the box is primary it holds changes
   that exist NOWHERE else, so back its DB up on a schedule — this both survives a
   box failure and produces the dump we restore back to the cloud at cutback.
   Offset from the (now-stopped) pull slot. `onplaya-db-dump.sh` on the box:
   ```bash
   #!/usr/bin/bash
   set -euo pipefail
   STAMP=$(date +%Y%m%d-%H%M)
   OUT=/home/mew/Census/OnPlayaData/server/${YEAR}_on_playa_server_data_v2.sql
   sudo docker exec census-database mysqldump -uroot -p"$LOCALPW" \
     --single-transaction --no-tablespaces --routines --triggers census > "$OUT"
   cp "$OUT" "/home/mew/db-backups/census-$STAMP.sql"   # rolling local backups
   # Push to OnPlayaData when there's uplink, so the cloud can pull it at cutback:
   cd /home/mew/Census/OnPlayaData && git add -A \
     && git commit -m "on-playa db dump $STAMP" && git push || true
   find /home/mew/db-backups -name 'census-*.sql' -mtime +2 -delete  # prune
   ```
   Crontab (offset from prod `:00`, peers `:05`, and the box's own pull `:02`):
   ```
   8,23,38,53 * * * * /home/mew/Census/CensusScheduler/onplaya-db-dump.sh >> /home/mew/Census/CensusScheduler/db-dump.log 2>&1
   ```
   > Writing the dump to the same `OnPlayaData/server/…_v2.sql` path the pull
   > restores from means a post-event cloud restore is the same git-pull +
   > load step, just in the other direction. The push is best-effort (`|| true`)
   > so an offline cycle doesn't wedge the cron.

6. **Leave prod read-only** (it's now a stale replica). Optionally show a banner
   pointing users to CensusLab.

### Rollback (if the box misbehaves at cutover)
Re-add the dnsmasq `volunteers.census.../<AWS_IP>` override + restart dnsmasq
(origin points back at AWS), take prod OUT of read-only. You're back to
Phase 1. Because prod was only frozen — never torn down — rollback is just a DNS
flip + unfreeze.

---

## Read-only mode (BUILT — PR #693)

Read-only mode exists (PR #693). How to use it:

- **Turn ON:** set two runtime env vars and restart the container (no rebuild):
  ```
  CENSUS_READ_ONLY=true
  CENSUS_READ_ONLY_MESSAGE=Schedule changes can only be made at CensusLab (6:30a). You can sign in and view, but changes are paused.
  ```
  `docker compose --file docker-compose-prod.yaml up -d --force-recreate`
- **Turn OFF:** remove the vars (or set `CENSUS_READ_ONLY=false`) and restart.
- **Enforcement:** `middleware.ts` returns **423 Locked** (with the message) for
  every mutating `/api/*` request (POST/PUT/PATCH/DELETE), for everyone including
  admins. Exceptions so people can still sign in: `/api/sign-in`,
  `/api/auth/sign-out`, `/api/provision/claim`.
- **Banner:** a site-wide `<Alert>` shows the message on every page (driven by
  `GET /api/read-only` → `useReadOnly` → `ReadOnlyBanner`).
- Prod runs `next start`, so the env is read at runtime — the flip is a restart,
  verified. Default (unset) = writes work as normal.

Same mechanism serves both the box ("read-only mirror" message) and prod at
cutover ("changes only at CensusLab").

> **Smoke-test after every flip.** Enforcement lives in middleware, and Next 16
> logs a deprecation ("`middleware` convention → `proxy`") — it runs through a
> compat shim today, so verify the flag actually took after the restart:
> ```
> curl -s https://<host>/api/read-only            # → {"readOnly":true,...}
> curl -s -o /dev/null -w "%{http_code}\n" \
>   -X POST https://<host>/api/dates -d '{}'       # → 423
> ```
> If enforcement ever regresses (a future Next drops the runtime env in
> middleware), move the write-guard into a Node-runtime wrapper (`withAuth`);
> the banner (`/api/read-only`, a Node page handler) already reads the flag
> correctly, so it stays accurate regardless.

---

## On-playa HTTPS + cert

The box must serve `https://volunteers.census.burningman.org` with the **real**
public cert so tablets trust it with zero per-device config (secure context for
PWA/SW; httpOnly cookies).

1. On AWS prod, the Let's Encrypt cert lives under
   `/etc/letsencrypt/live/volunteers.census.burningman.org/`. Copy `fullchain.pem`
   + `privkey.pem` to the box **before playa** (they're valid ~90 days — refresh
   right before the event, or issue a longer cert via DNS-01).
2. Restore an **nginx TLS terminator** in front of the app on the box (the
   `census-nginx` service was removed 2026-07 when the box went HTTP-only; restore
   from git history). nginx listens 443 with the copied cert, proxies to the app
   on `:3000`. Keep `:80` too (redirect to 443).
3. dnsmasq already resolves the hostname to the box; with a real cert the origin
   is trusted offline.

> Cert is public-CA, so it's valid regardless of which box serves it — the same
> cert works on AWS and on the copy on the local box (same hostname).

---

## Connectivity-check "proof of internet" (keeping tablet wifi up)

Current `dnsmasq.conf` pins several Google domains to **real IPs** so Android
tablets believe they're online (else they drop the wifi):
`connectivitycheck.gstatic.com`, `www.google.cn`, `mtalk.google.com`,
`alt2-mtalk.google.com`, `play.googleapis.com`, `2.android.pool.ntp.org`.

**Can these move local?** Partially:

- **Captive-portal check** (`connectivitycheck.gstatic.com/generate_204`, also
  `www.google.cn`): Android fetches these expecting **HTTP 204**. This one CAN be
  served locally — point dnsmasq at the box and have nginx return `204` for
  `/generate_204`. Removes the dependency on a live Google IP. ✅ (Recommended.)
- **NTP** (`2.android.pool.ntp.org`): run an NTP server on the box (`chrony`/`ntpd`)
  and point the domain local. Tablets keep time offline. ✅ (Feasible.)
- **FCM push** (`mtalk.google.com`, `alt2-mtalk.google.com`) and **Play services**
  (`play.googleapis.com`): these are TLS/proprietary Google endpoints — we can't
  serve them locally (no cert, no protocol). They must stay pinned to real IPs,
  and **those IPs may need refreshing** if tablets report "no internet" (they're
  hardcoded, current-as-of-2026-07). ❌ (Can't move local.)

**Recommendation:** move the HTTP captive-portal check and NTP local (removes two
moving IPs); leave FCM/Play pinned but document that they need a refresh check
before the event. This is a `dnsmasq.conf` + small nginx-config change — say the
word and I'll do it as its own PR.

---

## Open items to confirm with Mew
1. ~~Read-only mode — build it?~~ **DONE** (PR #693).
2. ~~DB-sync mechanism/host~~ **RESOLVED:** box `git pull`s `OnPlayaData` + restores
   the mysqldump; three machines (prod / peers / on-playa box, NOT the test box)
   staggered `0/5/10`-style. Confirm the exact minutes vs peers' real schedule.
3. Move captive-portal check + NTP local? (recommended — own PR)
4. Cert refresh cadence / DNS-01 for a longer cert.
