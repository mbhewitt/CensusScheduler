# On-playa/test DB is MariaDB, matching prod (11.8.x) so prod dumps load natively
# with no collation translation. Version pinned via build arg (never `latest`):
# an unpinned base once jumped major versions and crash-looped the DB after a
# prune + rebuild. Switching engines (MySQL->MariaDB) needs a FRESH data volume —
# the old MySQL data dir is not readable by MariaDB.
ARG MYSQL_VERSION=11.8
FROM mariadb:${MYSQL_VERSION}

COPY scheduler_schema.sql /docker-entrypoint-initdb.d

ENV MYSQL_DATABASE=census

EXPOSE 3306
