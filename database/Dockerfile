# MySQL version is pinned per-environment via build arg so each deployment
# matches its own existing data-dir version (MySQL has no in-place downgrade):
#   playa      = 9.4  (docker-compose-playa.yaml, ephemeral 9.4 data)
#   cloud/test = 9.7  (docker-compose.yaml, persistent 9.7 volume)
# Unpinned `latest` once jumped to 26.7 and crash-looped the on-playa DB after a
# `docker system prune -fa` + rebuild, hence pinning.
ARG MYSQL_VERSION=9.4
FROM mysql:${MYSQL_VERSION}

COPY scheduler_schema.sql /docker-entrypoint-initdb.d

ENV MYSQL_DATABASE=census

EXPOSE 3306
