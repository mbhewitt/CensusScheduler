FROM mysql

COPY on_playa_server_data.sql /docker-entrypoint-initdb.d

ENV MYSQL_ROOT_PASSWORD=admin
ENV MYSQL_DATABASE=census

EXPOSE 3306
