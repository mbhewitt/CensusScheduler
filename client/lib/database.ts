import mysql from "mysql2";

// dateStrings: return DATE/DATETIME columns as "YYYY-MM-DD" strings instead of
// JS Date objects pinned to UTC midnight. Without this, a DATE value like
// 2026-08-25 arrives as 2026-08-25T00:00:00Z and dayjs renders it in the
// browser's local zone — west-of-UTC browsers see Aug 24, and re-saving writes
// the shifted day back to the DB.
export const pool = mysql
  .createPool({
    connectionLimit: 10,
    database: process.env.MYSQL_DATABASE,
    dateStrings: true,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASSWORD,
    user: process.env.MYSQL_USER,
  })
  .promise();
