import mysql from "mysql2";

export const pool = mysql
  .createPool({
    connectionLimit: 10,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASSWORD,
    user: process.env.MYSQL_USER,
  })
  .promise();
