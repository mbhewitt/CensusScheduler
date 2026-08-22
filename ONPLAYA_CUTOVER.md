# On-Playa Ops & Cutover Runbook

How the CensusScheduler on-playa box (CensusLab, `192.168.11.11`) runs during
the event and how we cut over from **cloud-primary** to **on-playa-primary**.

Everything runs on the **single origin** `volunteers.census.burningman.org` —
there is no separate playa hostname. Which server that name resolves to is
controlled entirely by the on-playa **dnsmasq** (split-horizon DNS): before
cutover it points at the *true* AWS IP; after cutover it points at the local
box. The installed PWA and passcode sign-in follow the DNS, so the same app
"is" cloud before cutover and local after, with no reinstall.

> ⚠️ **Blocking prerequisite — read-only mode is NOT built yet.** The app has no
> maintenance/read-only capability today (verified 2026-08-21). Phases 1 and 2
> below assume a read-only mode with a banner exists. **It must be built before
> this runbook is executable.** See [§Read-only mode](#read-only-mode-must-be-built).

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

4. **DB sync cron: pull the live prod DB every 15 min → load into the box.**
   New mechanism (the existing `census-deploy.sh` loads a *committed* dump, not a
   live pull). Sketch (`onplaya-db-sync.sh`, runs on the box):
   ```bash
   mysqldump -h <AWS_RDS_HOST> -u census -p<pw> \
     --single-transaction --no-tablespaces --set-gtid-purged=OFF census \
     | gzip > /tmp/census-sync.sql.gz
   gunzip -c /tmp/census-sync.sql.gz \
     | sudo docker exec -i census-database mariadb -uroot -p<localpw> census
   ```
   Cron, offset to finish BEFORE peers' ops cron (which runs `*/15` on the
   `:00/:15/:30/:45` boundaries):
   ```
   2,17,32,47 * * * * /home/.../onplaya-db-sync.sh >> /var/log/census-sync.log 2>&1
   ```
   > **CONFIRM:** the `2,17,32,47` offset assumes peers' ops cron is at
   > `0,15,30,45`. Adjust so the DB is fresh *before* peers' job reads it, and
   > confirm which host owns which cron. Sync only runs while the box has uplink;
   > that's fine — it just no-ops when prod is unreachable.

5. **Keep the prod→box sync running from now until the end of Burning Man**, so
   the box is never more than ~15 min stale and can take over at any moment.

---

## Phase 2 — Cutover (box becomes PRIMARY)

Do this at the announced time (changes resume *"at CensusLab @ 6:30a"*). Order
matters — freeze prod first so no write is lost between the final sync and the
DNS flip.

1. **Put PROD into read-only mode + banner:**
   > *"Schedule changes can only be made at CensusLab (6:30a). You can sign in
   > and view your schedule, but changes are paused until then."*
   People can still log in and read; all writes are blocked. See §Read-only mode.

2. **Final DB sync** prod → box (run `onplaya-db-sync.sh` once manually) so the
   box has prod's last state, then **stop the sync cron** (the box is about to be
   the source of truth — further prod pulls would clobber local writes).

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

5. **Leave prod read-only** (it's now a stale replica). Optionally show a banner
   pointing users to CensusLab.

### Rollback (if the box misbehaves at cutover)
Re-add the dnsmasq `volunteers.census.../<AWS_IP>` override + restart dnsmasq
(origin points back at AWS), take prod OUT of read-only. You're back to
Phase 1. Because prod was only frozen — never torn down — rollback is just a DNS
flip + unfreeze.

---

## Read-only mode (MUST BE BUILT)

There is **no read-only/maintenance mode in the app today.** Both phases need it.
Minimal design (small feature, one PR):

- **Toggle:** a runtime signal (env var read at request time, e.g.
  `CENSUS_READ_ONLY=true`, or a `op_settings` row) so it flips with a container
  restart — no rebuild. Runtime, not `NEXT_PUBLIC_*` (those are build-time).
- **Enforcement (server):** a guard on all mutating API routes (POST/PATCH/PUT/
  DELETE) — reuse the `withWriteGuard`/`withAuth` wrapper pattern — returns
  **423 Locked** (or 403) with the banner message when read-only is on. This is
  the real enforcement; belt-and-suspenders like the passcode gate.
- **Banner (client):** a top-of-page `<Alert>` with the configurable message,
  shown when a `/api/settings` (or similar) reports read-only. Reuse the header
  area.
- **Configurable message + "changes at 6:30a"** so the same mechanism serves both
  the box ("read-only mirror") and prod-at-cutover ("changes only at CensusLab").

**~1 PR. Not built. Want me to build it?** It's a prerequisite for this runbook.

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
1. Read-only mode — build it? (blocking prerequisite)
2. DB-sync cron: exact host (box vs a prod-side dumper) and the offset vs peers'
   ops cron.
3. Move captive-portal check + NTP local? (recommended)
4. Cert refresh cadence / DNS-01 for a longer cert.
