FROM mysql

COPY scheduler_schema.sql /docker-entrypoint-initdb.d

ENV MYSQL_DATABASE=census

EXPOSE 3306
