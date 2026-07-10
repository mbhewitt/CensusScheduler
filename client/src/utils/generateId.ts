import { RowDataPacket } from "mysql2";

import { pool } from "lib/database";

const randomNum = () => Math.floor(Math.random() * 1000000 + 1);

const checkIsIdExists = async (query: string, id: number) => {
  const [dbIdList] = await pool.query<RowDataPacket[]>(query, [id]);
  const [dbIdFirst] = dbIdList;

  return Boolean(dbIdFirst);
};

export const generateId = async (query: string): Promise<number> => {
  let idNew = randomNum();
  while (await checkIsIdExists(query, idNew)) {
    idNew = randomNum();
  }
  return idNew;
};
