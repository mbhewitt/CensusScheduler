#!/usr/bin/bash
#
# Census Scheduler auto-deploy script
# Polls CensusScheduler and OnPlayaData repos for main branch updates.
# On change: rebuilds Docker, refreshes DB (max once/day).
#
# Usage: Run via cron or systemd timer.
#   */15 * * * * /home/mew/Census/CensusScheduler/census-deploy.sh >> /home/mew/Census/CensusScheduler/deploy.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CENSUS_DIR="$SCRIPT_DIR"
ONPLAYA_DIR="$(dirname "$SCRIPT_DIR")/OnPlayaData"
LOCKFILE="/tmp/census-deploy.lock"
DB_REFRESH_MARKER="/tmp/census-db-last-refresh"
DB_PASSWORD_FILE="$CENSUS_DIR/.env"
LOG_PREFIX="[census-deploy]"
LOCK_MAX_AGE_SECONDS=1800  # Kill stuck deploys after 30 minutes

log() {
    echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S') $*"
}

# Prevent concurrent runs (with age-based failsafe for hung processes)
if [ -f "$LOCKFILE" ]; then
    LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || true)
    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
        LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCKFILE") ))
        if [ "$LOCK_AGE" -gt "$LOCK_MAX_AGE_SECONDS" ]; then
            log "Lock held by PID $LOCK_PID for ${LOCK_AGE}s (>${LOCK_MAX_AGE_SECONDS}s). Killing hung deploy."
            kill -9 "$LOCK_PID" 2>/dev/null || true
            rm -f "$LOCKFILE"
        else
            log "Another instance is running (PID $LOCK_PID, age ${LOCK_AGE}s). Exiting."
            exit 0
        fi
    else
        log "Stale lock file found. Removing."
        rm -f "$LOCKFILE"
    fi
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

# Generate a new random DB password and write to .env for docker-compose
generate_db_password() {
    local password
    password=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    echo "MYSQL_ROOT_PASSWORD=$password" > "$DB_PASSWORD_FILE"
    chmod 600 "$DB_PASSWORD_FILE"
    log "Generated new DB password."
}

# Read the current DB password from .env
get_db_password() {
    if [ -f "$DB_PASSWORD_FILE" ]; then
        grep -oP 'MYSQL_ROOT_PASSWORD=\K.*' "$DB_PASSWORD_FILE"
    else
        echo ""
    fi
}

# Calculate the event year (3 months ahead, matching get_year.sh)
YEAR=$(date -d "3 month" +%Y)

# Pull a repo and return 0 if there were new commits
pull_repo() {
    local repo_dir="$1"
    local repo_name="$(basename "$repo_dir")"

    if [ ! -d "$repo_dir/.git" ]; then
        log "WARNING: $repo_dir is not a git repo. Skipping."
        return 1
    fi

    cd "$repo_dir"
    git fetch origin main 2>/dev/null

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" = "$REMOTE" ]; then
        log "$repo_name: up to date ($LOCAL)"
        return 1
    fi

    log "$repo_name: new commits detected ($LOCAL -> $REMOTE)"
    git checkout main 2>/dev/null
    git pull origin main
    return 0
}

# Check if DB was already refreshed today
db_refreshed_today() {
    if [ -f "$DB_REFRESH_MARKER" ]; then
        LAST_REFRESH=$(cat "$DB_REFRESH_MARKER")
        TODAY=$(date +%Y-%m-%d)
        if [ "$LAST_REFRESH" = "$TODAY" ]; then
            return 0
        fi
    fi
    return 1
}

# Refresh database from OnPlayaData SQL dump
refresh_database() {
    local sql_file="$ONPLAYA_DIR/server/${YEAR}_on_playa_server_data.sql"

    if [ ! -f "$sql_file" ]; then
        log "DB refresh: SQL file not found: $sql_file"
        return 1
    fi

    log "DB refresh: loading $sql_file into census-database container..."

    # Get the running database container
    local db_container
    db_container=$(sudo docker ps --filter "name=census-database" --format '{{.Names}}' | head -1)

    if [ -z "$db_container" ]; then
        log "DB refresh: census-database container not running. Skipping."
        return 1
    fi

    # Wait for MySQL to be ready (important after fresh container start)
    local db_pass
    db_pass=$(get_db_password)
    local retries=0
    while ! sudo docker exec "$db_container" mysqladmin ping -uroot -p"$db_pass" --silent 2>/dev/null; do
        retries=$((retries + 1))
        if [ "$retries" -ge 30 ]; then
            log "DB refresh: MySQL not ready after 30 attempts. Skipping."
            return 1
        fi
        log "DB refresh: waiting for MySQL to be ready... ($retries/30)"
        sleep 2
    done

    # Load the SQL file - this wipes and reloads the op_* tables
    sudo docker exec -i "$db_container" mysql -uroot -p"$db_pass" census < "$sql_file"


    # Blank PII - test server should not contain real names, emails, phones
    log "DB refresh: blanking PII..."
    sudo docker exec -i "$db_container" mysql -uroot -p"$db_pass" census < "$CENSUS_DIR/blank_pii.sql"
    log "DB refresh: PII blanked."
    date +%Y-%m-%d > "$DB_REFRESH_MARKER"
    log "DB refresh: complete."
}

# Ensure DB password exists (generated once, persists with the volume)
ensure_db_password() {
    if [ ! -f "$DB_PASSWORD_FILE" ]; then
        generate_db_password
    fi
}

# Rebuild and restart Docker services
# Build FIRST, then stop old containers — keeps the site up during builds.
# If the build fails/times out, old containers keep running.
rebuild_docker() {
    log "Docker: rebuilding and restarting..."
    cd "$CENSUS_DIR"

    # Prune old build cache to prevent disk bloat on this small droplet
    sudo docker buildx prune -af 2>/dev/null || true
    sudo docker system prune -f

    # Build new images while old containers are still serving traffic
    if ! timeout --kill-after=30 600 sudo docker compose --file docker-compose.yaml build; then
        log "Docker: BUILD FAILED or timed out. Old containers left running."
        return 1
    fi

    # Build succeeded — now swap: stop old, start new
    # Password persists with the DB volume — only generate if missing
    ensure_db_password
    sudo docker compose --file docker-compose.yaml down
    timeout --kill-after=10 120 sudo docker compose --file docker-compose.yaml up -d

    log "Docker: rebuild complete."
}

# --- Main ---
log "=== Starting deploy check ==="

SCHEDULER_UPDATED=false
ONPLAYA_UPDATED=false

if pull_repo "$CENSUS_DIR"; then
    SCHEDULER_UPDATED=true
fi

if pull_repo "$ONPLAYA_DIR"; then
    ONPLAYA_UPDATED=true
fi

if [ "$SCHEDULER_UPDATED" = true ]; then
    log "Code changes detected. Rebuilding Docker..."
    rebuild_docker
    # Always refresh DB after a rebuild — the container may have reinitialized
    log "DB refresh: forced after container rebuild."
    refresh_database
elif [ "$ONPLAYA_UPDATED" = true ]; then
    if ! db_refreshed_today; then
        refresh_database
    else
        log "DB refresh: already refreshed today. Skipping."
    fi
else
    log "No changes detected."
fi

log "=== Deploy check complete ==="
