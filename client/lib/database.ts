import mysql from "mysql2";

// MYSQL_SSL=true enables TLS for hosted DBs like RDS that require secure
// transport. Local docker DB on test/playa boxes leaves it unset.
const sslOption = process.env.MYSQL_SSL ? { ssl: "Amazon RDS" } : {};

export const pool = mysql
  .createPool({
    connectionLimit: 10,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASSWORD,
    user: process.env.MYSQL_USER,
    ...sslOption,
  })
  .promise();
