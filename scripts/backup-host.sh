#!/usr/bin/env bash
#
# backup-host.sh — a second, independent backup path that runs directly on
# the HOST via cron (not inside docker-compose). Useful as a fallback in
# case the `backup` container itself is down/misconfigured, and because it
# doesn't depend on the app's docker network at all.
#
# Usage: add to host crontab, e.g.:
#   crontab -e
#   0 3 * * *  /opt/edl-e-document/scripts/backup-host.sh >> /var/log/edl-backup.log 2>&1
#
# Requires: pg_dump installed directly on host OS, and optionally aws CLI for S3 upload.

set -euo pipefail

# ---- Configuration ---------------------------------------------------
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"
BACKUP_DIR="${HOST_BACKUP_DIR:-/opt/edl-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# shellcheck disable=SC1090
[[ -f "${ENV_FILE}" ]] && source "${ENV_FILE}"

PGDATABASE="${POSTGRES_DB:-edl_edoc_db}"
PGUSER="${POSTGRES_USER:-postgres}"
FILENAME="${PGDATABASE}_host_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

mkdir -p "${BACKUP_DIR}"

log "Starting host-side backup of '${PGDATABASE}' directly on Host"

if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    --host="127.0.0.1" \
    --username="${PGUSER}" \
    --dbname="${PGDATABASE}" \
    --format=plain \
    --no-owner \
    --no-privileges \
    | gzip -9 > "${FILEPATH}.tmp"; then
    mv "${FILEPATH}.tmp" "${FILEPATH}"
    log "Backup created: ${FILEPATH} ($(du -h "${FILEPATH}" | cut -f1))"
else
    rm -f "${FILEPATH}.tmp"
    log "ERROR: pg_dump failed"
    exit 1
fi

if [[ -n "${S3_BUCKET:-}" ]]; then
    S3_URI="s3://${S3_BUCKET}/${S3_PREFIX:-edl-edoc/postgres}/host/${FILENAME}"
    EXTRA_ARGS=()
    [[ -n "${AWS_ENDPOINT_URL:-}" ]] && EXTRA_ARGS+=(--endpoint-url "${AWS_ENDPOINT_URL}")
    if aws s3 cp "${FILEPATH}" "${S3_URI}" "${EXTRA_ARGS[@]}"; then
        log "Uploaded to ${S3_URI}"
    else
        log "WARNING: S3 upload failed — local backup kept at ${FILEPATH}"
    fi
fi

log "Pruning host backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete

log "Host backup job finished successfully"
