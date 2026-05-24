# Production Deploy Runbook

How to (re)build the Census prod app on a fresh AWS box. Target host:
`volunteers.census.burningman.org` → AWS EC2 (currently `54.68.158.145`).

This is the **app only** — the database lives in AWS RDS and is not
provisioned here.

---

## Prerequisites (must exist before deploy)

| Resource | Where | Notes |
|---|---|---|
| RDS instance | `general2.cqnwnqf5ezh1.us-west-2.rds.amazonaws.com` | MariaDB 11.x, security group must allow inbound 3306 from the EC2 box |
| RDS DB + user | DB `census`, user `census` | Created out of band by an admin who has the master credentials. Connection details are in `/home/census/dbinfo.txt` on the prod box. |
| DNS | `volunteers.census.burningman.org` → public IP of the box | A or CNAME, must propagate before Let's Encrypt step |
| Okta app | BM Okta tenant `login.burningman.org/oauth2/default` | Redirect URI `https://volunteers.census.burningman.org/api/auth/okta/callback` must be on the app's whitelist. CLIENT_ID/SECRET come from the BM admin. |
| EC2 SG | Inbound 22, 80, 443 open | 80 needed for ACME http-01 challenges; 443 is the public site |
| `census` Linux user | `/home/census/`, owns the code and runs the container | If missing: `sudo useradd -m -s /bin/bash census` |

---

## Step 1 — Box prep

```bash
ssh <admin>@<prod-box>

# Swap (the t3.small / t3.micro tier doesn't have enough RAM for the next.js build)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Docker (Debian — adjust for other distros)
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker census          # so census user can run docker without sudo

# nginx + certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

---

## Step 2 — Get the code

```bash
sudo -u census bash -c '
  cd /home/census
  git clone https://github.com/mbhewitt/CensusScheduler.git
  cd CensusScheduler
  git checkout main          # or the latest deploy bundle, e.g. deploy/test-bundle
'
```

The deployed branch must include the `MYSQL_SSL` flag (PR #283 / commit
`85aea1c`) — without it the mysql2 client cannot reach RDS, which has
`require_secure_transport=ON`.

---

## Step 3 — Write `.env.production`

> **⚠ This file is `.gitignore`d** (PR #272). It lives **only** on the prod
> box. A `git reset --hard` or `git checkout` of a different branch will
> not affect it, but **a fresh clone won't have it** — you must recreate
> it from this template every time you stand up a new box. Keep the
> values out of the repo.

```bash
sudo -u census tee /home/census/CensusScheduler/client/.env.production > /dev/null <<'EOF'
# database (RDS)
MYSQL_DATABASE = "census"
MYSQL_HOST     = "general2.cqnwnqf5ezh1.us-west-2.rds.amazonaws.com"
MYSQL_USER     = "census"
MYSQL_PASSWORD = "<password from /home/census/dbinfo.txt>"
MYSQL_SSL      = "true"

# okta oauth (Burning Man)
OKTA_CLIENT_ID         = "<from BM Okta admin>"
OKTA_CLIENT_SECRET     = "<from BM Okta admin>"
OKTA_ISSUER            = "https://login.burningman.org/oauth2/default"
OKTA_REDIRECT_URI      = "https://volunteers.census.burningman.org/api/auth/okta/callback"
NEXT_PUBLIC_OKTA_ENABLED = "true"

# off-playa: passcode auth disabled, Okta is the only sign-in path.
# On-playa boxes (no internet) must leave this unset or "true".
NEXT_PUBLIC_PIN_ENABLED = "false"
EOF
sudo chown census:census /home/census/CensusScheduler/client/.env.production
sudo chmod 600 /home/census/CensusScheduler/client/.env.production
```

`NEXT_PUBLIC_OKTA_ENABLED` is baked in at build time (Next.js
convention) — change it and you need to rebuild. The other vars are
read at runtime, so changes take effect with just a container restart.

---

## Step 4 — Write the prod compose file

The repo's `docker-compose.yaml` brings up a sidecar database
container. Prod uses RDS, so we use a slim override that contains only
the app service:

```bash
sudo -u census tee /home/census/CensusScheduler/docker-compose-prod.yaml > /dev/null <<'EOF'
services:
  census:
    build:
      context: client
      dockerfile: Dockerfile
    container_name: census-app
    env_file:
      - ./client/.env.production
    security_opt:
      - apparmor:unconfined
    sysctls:
      # Tighten kernel TCP keep-alive retry math so dead pool
      # connections surface in ~30s instead of Linux's default ~11min
      # (defaults: tcp_keepalive_intvl=75, tcp_keepalive_probes=9 →
      # 75 × 9 = 675s after the first probe before the kernel
      # declares dead). Pairs with the mysql2 keepAliveInitialDelay
      # in client/lib/database.ts. Both are net-namespaced sysctls so
      # docker allows them without privileged mode.
      net.ipv4.tcp_keepalive_intvl: "10"
      net.ipv4.tcp_keepalive_probes: "3"
    ports:
      - "127.0.0.1:3000:3000"   # bound to loopback; nginx is the public face
    restart: always
EOF
```

---

## Step 5 — Seed the database

If RDS is already populated, skip this step.

```bash
# On the test server: dump the source schema + data
ssh root@<test-server>
docker exec census-database mysqldump -uroot -p<TEST_DB_PW> \
  --single-transaction --no-tablespaces --routines --triggers \
  --set-gtid-purged=OFF --column-statistics=0 \
  census | gzip > /tmp/census-prod-seed.sql.gz

# Transfer to prod box
scp /tmp/census-prod-seed.sql.gz <admin>@<prod>:/tmp/

# Load into RDS
ssh <admin>@<prod>
gunzip -c /tmp/census-prod-seed.sql.gz | \
  mysql -u census -h general2.cqnwnqf5ezh1.us-west-2.rds.amazonaws.com \
        -p'<password>' census
```

### PII scrub (keep only allow-listed users)

```sql
-- shiftboard_ids to KEEP (everyone else is deleted along with their FK rows)
-- 1=Admin, 3234=Captain Mew (mu@burningman.org), 23697=Chipper, 22540=Random,
-- 3265=Rescue, 837918=Woodie, 835267=Prizmo
-- Update the list below if the keep set changes.
--
-- Note: many of these accounts have email = NULL in the source data, which means
-- Okta sign-in cannot match them by email. After the scrub, manually set email
-- and okta_id on the records that should auto-link to a real Okta user, e.g.:
--   UPDATE op_volunteers SET email='mu@burningman.org', okta_id='<sub>' WHERE shiftboard_id=3234;
-- Otherwise the first Okta login creates a duplicate account.

DELETE FROM op_saps             WHERE shiftboard_id NOT IN (1, 23697, 3234, 835267, 22540, 3265, 837918);
DELETE FROM op_volunteer_roles  WHERE shiftboard_id NOT IN (1, 23697, 3234, 835267, 22540, 3265, 837918);
DELETE FROM op_volunteer_shifts WHERE shiftboard_id NOT IN (0, 1, 23697, 532887, 835267, 22540, 3265, 837918);  -- keep 0 (= unfilled slots)
DELETE FROM op_volunteers       WHERE shiftboard_id NOT IN (1, 23697, 3234, 835267, 22540, 3265, 837918);
```

Run the deletes in this order; FKs from the child tables to
`op_volunteers.shiftboard_id` would otherwise block the parent delete.

---

## Step 6 — Build and start

```bash
sudo -u census bash -c '
  cd /home/census/CensusScheduler
  docker compose --file docker-compose-prod.yaml build       # ~10 min on a 2-core box
  docker compose --file docker-compose-prod.yaml up -d
'

# Wait for "Ready" in logs
sudo docker logs -f census-app
```

App should now be answering on `127.0.0.1:3000`.

---

## Step 7 — nginx + TLS

```bash
sudo tee /etc/nginx/sites-available/census.conf > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name volunteers.census.burningman.org;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 300s;
    }
}
EOF
sudo mkdir -p /var/www/html
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/basic-site.conf
sudo ln -sf /etc/nginx/sites-available/census.conf /etc/nginx/sites-enabled/census.conf
sudo nginx -t && sudo systemctl reload nginx

# Get the cert (DNS must already point to this box)
sudo certbot --nginx -d volunteers.census.burningman.org \
  --non-interactive --agree-tos --redirect \
  --email <ops-email>
```

Certbot edits the nginx config in place to add the HTTPS server block
and an HTTP→HTTPS 301. A cron job (installed by the Debian certbot
package) auto-renews.

---

## Step 8 — Verify

```bash
# Local app
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/

# Through nginx + TLS
curl -s -o /dev/null -w "%{http_code}\n" https://volunteers.census.burningman.org/

# Database round-trip
curl -s https://volunteers.census.burningman.org/api/shifts | head -c 200

# Okta start (302 to login.burningman.org with correct redirect_uri)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" \
  https://volunteers.census.burningman.org/api/auth/okta
```

End-to-end Okta sign-in: load the site in a browser, click "Sign in",
expect to bounce to BM Okta and back. If you get
`redirect_uri_mismatch`, the redirect URI hasn't been added to the BM
Okta app's whitelist — talk to the BM Okta admin.

---

## Routine ops

| What | How |
|---|---|
| Pull a new code release | `cd /home/census/CensusScheduler && git fetch && git checkout <ref>`, then `docker compose --file docker-compose-prod.yaml build && docker compose --file docker-compose-prod.yaml up -d` |
| Tail app logs | `sudo docker logs -f census-app` |
| Container restart only (env change) | `sudo -u census docker compose --file docker-compose-prod.yaml up -d --force-recreate` |
| Rotate Okta secret | edit `client/.env.production`, restart the container |
| TLS renewal | automatic via certbot's systemd timer; force with `sudo certbot renew` |
| DB shell | `mysql -u census -h general2.cqnwnqf5ezh1.us-west-2.rds.amazonaws.com -p census` (password in `/home/census/dbinfo.txt`) |

## Things that will bite you

- **Build OOM on small instances.** Without swap the next.js build silently dies. Step 1's swap line is mandatory on ≤ 2 GB boxes.
- **`require_secure_transport`.** RDS rejects plaintext mysql connections. The app must run a build that includes `MYSQL_SSL` support in `client/lib/database.ts` AND `MYSQL_SSL=true` in the env.
- **Okta redirect URI is hostname-exact.** Changing the public hostname (e.g. v2 → volunteers) means: (a) update DNS, (b) get a new cert, (c) update `OKTA_REDIRECT_URI`, (d) ask BM Okta admin to whitelist the new callback URL. Sign-in stays broken until (d) lands.
- **Sidecar `database` service.** The repo's default `docker-compose.yaml` includes one. Don't use it on prod — that's why we keep `docker-compose-prod.yaml` and always pass `--file docker-compose-prod.yaml`.
