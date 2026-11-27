import { RowDataPacket } from "mysql2";

import { pool } from "lib/database";

const randomNum = () => Math.floor(Math.random() * 1000000 + 1);

const checkIsIdExists = async (query: string, id: number) => {
  const [dbIdList] = await pool.query<RowDataPacket[]>(query, [id]);
  const [dbIdFirst] = dbIdList;

  return Boolean(dbIdFirst);
};

// #271: re-roll until the id is unused, and only then return it.
// ponytail: still check-then-insert, so two concurrent requests can pick the
// same free id; a DB AUTO_INCREMENT would close that (needs a migration).
export const generateId = async (query: string) => {
  let idNew = randomNum();

  while (await checkIsIdExists(query, idNew)) idNew = randomNum();

  return idNew;
};
