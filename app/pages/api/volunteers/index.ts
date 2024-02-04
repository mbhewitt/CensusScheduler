import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import { pool } from "lib/database";
import { IDataVolunteerShiftCountItem } from "src/components/types";

interface IVolunteerAccount {
  email: string;
  isCoreCrew: boolean;
  playaName: string;
  shiftboardId: number;
  worldName: string;
}
interface IDataDbVolunteerItem {
  noshow: string;
  notes: string;
  playa_name: string;
  shiftboard_id: string;
  world_name: string;
}

const volunteers = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // get
    case "GET": {
      const { filter } = req.query;
      let dataVolunteerList = [];

      switch (filter) {
        // get core volunteers
        case "core": {
          const [dataDbVolunteerList] = await pool.query<RowDataPacket[]>(
            `SELECT playa_name, shiftboard_id, world_name
            FROM op_volunteers
            WHERE core_crew=true
            ORDER BY playa_name`
          );

          dataVolunteerList = dataDbVolunteerList.map(
            ({ playa_name, shiftboard_id, world_name }) => ({
              playaName: playa_name,
              shiftboardId: shiftboard_id,
              worldName: world_name,
            })
          );

          break;
        }
        // get all volunteers
        case "all": {
          const [dataDbVolunteerList] = await pool.query<RowDataPacket[]>(
            `SELECT email, new_account, phone, playa_name, shiftboard_id, world_name
            FROM op_volunteers
            ORDER BY playa_name`
          );
          const [dataDbVolunteerRoleList] = await pool.query<RowDataPacket[]>(
            `SELECT *
            FROM op_volunteer_roles
            ORDER BY shiftboard_id`
          );
          const dataVolunteerRoleMap: { [key: string]: string[] } = {};

          dataDbVolunteerRoleList.forEach(({ shiftboard_id, roles }) => {
            if (dataVolunteerRoleMap[shiftboard_id]) {
              dataVolunteerRoleMap[shiftboard_id].push(roles);
            } else {
              dataVolunteerRoleMap[shiftboard_id] = [roles];
            }
          });
          dataVolunteerList = dataDbVolunteerList.map(
            ({
              email,
              new_account,
              phone,
              playa_name,
              shiftboard_id,
              world_name,
            }) => ({
              email,
              isNewAccount: Boolean(new_account),
              phone,
              playaName: playa_name,
              roleList: dataVolunteerRoleMap[shiftboard_id],
              shiftboardId: shiftboard_id,
              worldName: world_name,
            })
          );

          break;
        }
        // get all volunteers and their shift counts
        default: {
          const [dataDbVolunteerList] = await pool.query<RowDataPacket[]>(
            `SELECT noshow, notes, playa_name, v.shiftboard_id, world_name
            FROM op_volunteers AS v
            LEFT JOIN op_volunteer_shifts AS vs
            ON v.shiftboard_id = vs.shiftboard_id
            ORDER BY playa_name, world_name`
          );

          const dataVolunteerMap = dataDbVolunteerList.reduce(
            (
              dataDbVolunteerTotal: {
                [key: string]: IDataVolunteerShiftCountItem;
              },
              {
                noshow,
                notes,
                playa_name,
                shiftboard_id,
                world_name,
              }: IDataDbVolunteerItem | RowDataPacket
            ) => {
              const dataDbVolunteerTotalNew =
                structuredClone(dataDbVolunteerTotal);

              if (!dataDbVolunteerTotalNew[`id${shiftboard_id}`]) {
                dataDbVolunteerTotalNew[`id${shiftboard_id}`] = {
                  attendedCount: 0,
                  isNotes: Boolean(notes),
                  noShowCount: 0,
                  playaName: playa_name,
                  remainingCount: 0,
                  shiftboardId: shiftboard_id,
                  worldName: world_name,
                };
              }
              switch (noshow) {
                case "Yes":
                  dataDbVolunteerTotalNew[
                    `id${shiftboard_id}`
                  ].noShowCount += 1;

                  break;
                case "":
                  dataDbVolunteerTotalNew[
                    `id${shiftboard_id}`
                  ].attendedCount += 1;

                  break;
                case "X":
                  dataDbVolunteerTotalNew[
                    `id${shiftboard_id}`
                  ].remainingCount += 1;

                  break;
                default:
              }

              return dataDbVolunteerTotalNew;
            },
            {}
          );

          dataVolunteerList = Object.keys(dataVolunteerMap).map(
            (shiftboardId) => dataVolunteerMap[shiftboardId]
          );
        }
      }

      return res.status(200).json({
        dataVolunteerList,
      });
    }
    // create volunteer account
    case "POST": {
      const {
        email,
        emergencyContact,
        location,
        passcodeCreate,
        phone,
        playaName,
        worldName,
      } = JSON.parse(req.body);
      const generateShiftboardId = () =>
        Math.floor(Math.random() * 1000000 + 1);
      const insertAccount = async (): Promise<IVolunteerAccount> => {
        const shiftboardIdRandom = generateShiftboardId();
        const [dataDbVolunteerList] = await pool.query<RowDataPacket[]>(
          `SELECT shiftboard_id
          FROM op_volunteers
          WHERE shiftboard_id=${shiftboardIdRandom}`
        );

        // if shiftboard ID exists already
        // then execute function recursively
        if (dataDbVolunteerList.length > 0) {
          return insertAccount();
        }
        await pool.query<RowDataPacket[]>(
          `INSERT IGNORE INTO op_volunteers (email, emergency_contact, location, new_account, passcode, phone, playa_name, shiftboard_id, world_name)
          VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`,
          [
            email,
            emergencyContact,
            location,
            passcodeCreate,
            phone,
            playaName,
            shiftboardIdRandom,
            worldName,
          ]
        );

        return {
          email,
          isCoreCrew: false,
          playaName,
          shiftboardId: shiftboardIdRandom,
          worldName,
        };
      };
      const account = await insertAccount();

      return res.status(200).json(account);
    }
    // patch
    case "PATCH": {
      const { update } = req.query;

      switch (update) {
        // reset volunteer passcode
        case "passcode": {
          const { passcode, shiftboardId } = JSON.parse(req.body);

          await pool.query<RowDataPacket[]>(
            `UPDATE op_volunteers
            SET passcode=?
            WHERE shiftboard_id=?`,
            [passcode, shiftboardId]
          );

          break;
        }

        // update volunteer profile
        default: {
          const {
            email,
            emergencyContact,
            location,
            notes,
            phone,
            playaName,
            shiftboardId,
            worldName,
          } = JSON.parse(req.body);

          await pool.query<RowDataPacket[]>(
            `UPDATE op_volunteers
            SET email=?, emergency_contact=?, location=?, needs_update=1, notes=?, phone=?, playa_name=?, world_name=?
            WHERE shiftboard_id=?`,
            [
              email,
              emergencyContact,
              location,
              notes,
              phone,
              playaName,
              worldName,
              shiftboardId,
            ]
          );
        }
      }

      return res.status(200).json({
        statusCode: 200,
        message: "Success",
      });
    }

    // default - send an error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default volunteers;
