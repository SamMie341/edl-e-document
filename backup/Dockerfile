FROM postgres:16-alpine

# postgres:16-alpine already has pg_dump/psql (matching major version).
# Add: bash, gzip, tzdata, aws-cli for optional S3 upload.
RUN apk add --no-cache \
        bash \
        gzip \
        tzdata \
        py3-pip \
    && pip install --no-cache-dir --break-system-packages awscli

WORKDIR /app
COPY backup.sh /app/backup.sh
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/backup.sh /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
