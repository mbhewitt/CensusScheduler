# Census Test Server — Deploy Notes (PEERS-OWNED)

Status: Mew handed `census-ops-test.houseziggurat.us` (DigitalOcean droplet
143.198.105.4) to peers on 2026-06-05. Auto-deploy is DISABLED on both
ends — every deploy is now a deliberate manual `docker compose up -d`
you trigger.

## Server access

```bash
ssh census-ops-test            # alias in ~/.ssh/config, key peers_droplet_ed25519
```

Web URL: https://census-ops-test.houseziggurat.us (Nginx + Let's Encrypt
cert; both managed by the droplet, you should not need to touch them).

## What lives on the droplet

| Path | Purpose |
|------|---------|
| `/root/Census/CensusScheduler/` | Repo checkout (your branch: `peers-main`) |
| `/root/Census/CensusScheduler/docker-compose.yaml` | The stack: `census-app` (port 3000) + `census-database` (MySQL 3306 internal) |
| `/root/Census/CensusScheduler/.env` | `MYSQL_ROOT_PASSWORD=...` — used by docker-compose |
| `/root/Census/CensusScheduler/client/.env.production` | App's runtime env (DB name, okta, session secret) — **YOU CREATE THIS, it's gitignored** |
| `/etc/nginx/sites-enabled/census-ops-test` | Nginx vhost (already configured) |

## Your MySQL database = `peers` (not `census`)

Mew created a separate `peers` MySQL database for you on the droplet
with just the bare-bone tables (`op_dates` copy + `op_volunteers` Admin
row). Use it instead of the `census` DB so you don't disturb mew's data.

`.env.production` should have `MYSQL_DATABASE=peers`.

## First-time bring-up recipe (the stack is currently down at handoff time)

1. SSH in + check repo branch:
   ```bash
   ssh census-ops-test
   cd /root/Census/CensusScheduler
   git checkout peers-main && git pull origin peers-main
   ```

2. Create `client/.env.production` (gitignored, must be made by hand).
   Get the MySQL root password from `/root/Census/CensusScheduler/.env`:
   ```bash
   ROOT_PW=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2)
   cat > client/.env.production << EOF
   MYSQL_DATABASE=peers
   MYSQL_HOST=database
   MYSQL_USER=root
   MYSQL_PASSWORD=${ROOT_PW}

   # okta — copy from Mew's last working .env.production OR disable:
   NEXT_PUBLIC_OKTA_ENABLED=false

   # session cookie secret (generate fresh):
   SESSION_SECRET=$(openssl rand -hex 32)
   EOF
   ```

3. Bring the stack up:
   ```bash
   docker compose up -d --build
   docker compose logs -f census   # tail until "ready on :3000"
   ```

4. Create the `peers` DB if it doesn't exist + seed it from `census`:
   ```bash
   ROOT_PW=$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2)
   docker exec -e MYSQL_PWD="$ROOT_PW" census-database mysql -uroot << SQL
   CREATE DATABASE IF NOT EXISTS peers;
   USE peers;
   CREATE TABLE IF NOT EXISTS op_dates LIKE census.op_dates;
   INSERT INTO op_dates SELECT * FROM census.op_dates;
   CREATE TABLE IF NOT EXISTS op_volunteers LIKE census.op_volunteers;
   INSERT INTO op_volunteers SELECT * FROM census.op_volunteers WHERE playa_name='Admin';
   SQL
   ```

5. Visit https://census-ops-test.houseziggurat.us — should be live.

## Routine deploys (after first bring-up)

```bash
ssh census-ops-test
cd /root/Census/CensusScheduler
git pull origin peers-main
docker compose up -d --build   # rebuilds only what changed; ~3 min normal
```

Watch for OOM on the build — the droplet has only 2GB RAM. If a build
hangs >10 min, kill it and fall back to `docker compose up -d` (no
`--build`) to bring up the last good image.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 502 Bad Gateway | Containers crashed. `docker compose up -d` (no rebuild) to restore last image. |
| Build hangs on "exporting layers" | OOM. `docker buildx prune -af` + retry. |
| MySQL connection refused | DB container slow to start. `docker compose restart database`, wait 10s. |
| Schema missing table | You forgot step 4 (DB seed). Run it. |
| Cert expired | `certbot renew` (cron handles this normally — only if it broke) |

## What NOT to do

- Do NOT re-enable the `*/15 census-deploy.sh` cron without telling Mew.
- Do NOT touch the `census` database (mew's data).
- Do NOT push to `main` of CensusScheduler upstream — always `peers-main`.
- Do NOT modify `/root/.ssh/authorized_keys` (your key + mew's key both live there).

## Provenance

- SSH key: `~/.ssh/peers_droplet_ed25519` (generated 2026-06-05 for this handoff).
  Pubkey added to droplet's `/root/.ssh/authorized_keys`.
- Cron disablement: both `mew@nucbox`'s crontab and the droplet's root
  crontab have `*/15 census-deploy.sh` commented (not removed) with the
  message `# DISABLED 2026-06-05 (peers handoff per Mew msg 1512320056)`.
