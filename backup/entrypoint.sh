#!/usr/bin/env bash
set -euo pipefail

CRON_SCHEDULE="${BACKUP_CRON_SCHEDULE:-0 2 * * *}"

# Write env vars to a file cron jobs can source (cron runs with a minimal
# environment, so we can't rely on the vars docker-compose injected here).
printenv | grep -E '^(PG|S3_|AWS_|BACKUP_)' > /app/backup.env

CRON_FILE="/etc/crontabs/root"
echo "${CRON_SCHEDULE} . /app/backup.env; /app/backup.sh >> /proc/1/fd/1 2>> /proc/1/fd/2" > "${CRON_FILE}"

echo "[entrypoint] Backup cron schedule: ${CRON_SCHEDULE}"
echo "[entrypoint] Running an initial backup now, then handing off to crond..."
# Run once immediately so you get a backup right after `docker compose up`,
# instead of waiting for the first scheduled tick.
/app/backup.sh || echo "[entrypoint] Initial backup failed — will retry on schedule"

exec crond -f -l 8
