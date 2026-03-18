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

log() {
    echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S') $*"
}

# Prevent concurrent runs
if [ -f "$LOCKFILE" ]; then
    LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || true)
    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
        log "Another instance is running (PID $LOCK_PID). Exiting."
        exit 0
    fi
    log "Stale lock file found. Removing."
    rm -f "$LOCKFILE"
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

    # Load the SQL file - this wipes and reloads the op_* tables
    local db_pass
    db_pass=$(get_db_password)
    sudo docker exec -i "$db_container" mysql -uroot -p"$db_pass" census < "$sql_file"

    date +%Y-%m-%d > "$DB_REFRESH_MARKER"
    log "DB refresh: complete."
}

# Rebuild and restart Docker services
rebuild_docker() {
    log "Docker: rebuilding and restarting..."
    cd "$CENSUS_DIR"

    generate_db_password

    sudo docker compose --file docker-compose.yaml down
    sudo docker system prune -f
    sudo docker compose --file docker-compose.yaml build
    sudo docker compose --file docker-compose.yaml up -d

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
fi

if [ "$SCHEDULER_UPDATED" = true ] || [ "$ONPLAYA_UPDATED" = true ]; then
    if ! db_refreshed_today; then
        refresh_database
    else
        log "DB refresh: already refreshed today. Skipping."
    fi
else
    log "No changes detected."
fi

log "=== Deploy check complete ==="
