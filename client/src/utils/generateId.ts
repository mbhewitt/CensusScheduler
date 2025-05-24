import { RowDataPacket } from "mysql2";

import { pool } from "lib/database";

const randomNum = () => Math.floor(Math.random() * 1000000 + 1);

const checkIsIdExists = async (query: string, id: number) => {
  const [dbIdList] = await pool.query<RowDataPacket[]>(query, [id]);
  const [dbIdFirst] = dbIdList;

  return Boolean(dbIdFirst);
};

export const generateId = (query: string) => {
  let idNew = 0;

  const changeNum = async () => {
    idNew = randomNum();

    const isIdExists = await checkIsIdExists(query, idNew);

    // if shift name ID exists already
    // then execute function recursively
    if (isIdExists) changeNum();
  };
  changeNum();

  return idNew;
};
