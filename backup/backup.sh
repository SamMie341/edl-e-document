#!/usr/bin/env bash
#
# backup.sh — dump the edl_edoc_db postgres database, gzip it, prune old
# local backups, and (optionally) sync to S3 / S3-compatible storage.
#
# Expects these environment variables (all have sane defaults, see
# docker-compose.yml / .env):
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
#   BACKUP_RETENTION_DAYS   (default 7)
#   S3_BUCKET               (optional — skip upload if empty)
#   S3_PREFIX               (default: edl-edoc/postgres)
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_DEFAULT_REGION
#   AWS_ENDPOINT_URL        (optional — for S3-compatible providers, e.g. MinIO, DO Spaces)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="${PGDATABASE:-edl_edoc_db}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

mkdir -p "${BACKUP_DIR}"

log "Starting backup of database '${PGDATABASE}' on ${PGHOST}:${PGPORT}"

# --- Dump + compress ---------------------------------------------------
if pg_dump \
    --host="${PGHOST}" \
    --port="${PGPORT}" \
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

# --- Upload to S3 (optional) --------------------------------------------
if [[ -n "${S3_BUCKET:-}" ]]; then
    S3_URI="s3://${S3_BUCKET}/${S3_PREFIX:-edl-edoc/postgres}/${FILENAME}"
    EXTRA_ARGS=()
    if [[ -n "${AWS_ENDPOINT_URL:-}" ]]; then
        EXTRA_ARGS+=(--endpoint-url "${AWS_ENDPOINT_URL}")
    fi

    if aws s3 cp "${FILEPATH}" "${S3_URI}" "${EXTRA_ARGS[@]}"; then
        log "Uploaded to ${S3_URI}"
    else
        log "WARNING: upload to S3 failed — local backup is still kept at ${FILEPATH}"
    fi
else
    log "S3_BUCKET not set — skipping remote upload (local-only backup)"
fi

# --- Prune old local backups ---------------------------------------------
log "Pruning local backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete

# --- S3 retention note ----------------------------------------------------
# We intentionally do NOT delete old objects from S3 here. Instead, set an S3
# Lifecycle rule on the bucket/prefix (e.g. expire objects under
# "${S3_PREFIX}/" after N days) — this is more reliable and is a one-time
# setup in your cloud console.

log "Backup job finished successfully"
