import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import type { IResVolunteerAccount } from "@/components/types/volunteers";
import { buildSessionCookie } from "@/lib/session";
import { pool } from "lib/database";

// New-account shiftboard_ids start at 10,000,000 — keeps a clear range
// above e2e test data (which uses 9,000,000+ per client/e2e/helpers/db.ts)
// and above all legacy imported volunteers. Per @mbhewitt 2026-05-23.
const NEW_USER_ID_FLOOR = 10_000_000;
const NEW_USER_ID_RANGE = 10_000_000; // candidate space [10M, 20M)

const generateNewUserShiftboardId = async (): Promise<number> => {
  // Loop until we find a free id. At 10M slots versus a handful of
  // sign-ups per day, collisions are vanishing — but the loop makes the
  // duplicate-check guarantee explicit (the legacy generateId() has a
  // known async race where the duplicate check resolves after the value
  // is already returned, see specs/training-confirmation-endpoint.md
  // gotcha #1).
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate =
      NEW_USER_ID_FLOOR + Math.floor(Math.random() * NEW_USER_ID_RANGE);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT shiftboard_id FROM op_volunteers WHERE shiftboard_id = ? LIMIT 1",
      [candidate]
    );
    if (rows.length === 0) return candidate;
  }
  throw new Error(
    "could not allocate a new shiftboard_id after 10 attempts — DB unusually full"
  );
};

const account = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    // post
    // ------------------------------------------------------------
    case "POST": {
      // create volunteer account
      const {
        email,
        emergencyContact,
        location,
        passcodeCreate,
        phone,
        playaName,
        worldName,
      } = JSON.parse(req.body);
      const shiftboardIdNew = await generateNewUserShiftboardId();

      // insert new account row
      await pool.query<RowDataPacket[]>(
        `INSERT INTO op_volunteers (
          create_volunteer,
          email,
          emergency_contact,
          location,
          passcode,
          phone,
          playa_name,
          shiftboard_id,
          world_name
        )
        VALUES (true, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          emergencyContact,
          location,
          passcodeCreate,
          phone,
          playaName,
          shiftboardIdNew,
          worldName,
        ]
      );

      const resAccount: IResVolunteerAccount = {
        email,
        emergencyContact,
        isCreated: true,
        location,
        notes: "",
        phone,
        playaName,
        roleList: [],
        shiftboardId: shiftboardIdNew,
        worldName,
      };

      // PEERS #walkin: sign the new walk-in in immediately by setting the
      // server-side session cookie (same as the passcode sign-in path). Without
      // this the client dispatches SESSION_SIGN_IN locally but the middleware
      // sees no session cookie on the next navigation and bounces them to
      // /sign-in — which is exactly the "create account sent me back to the
      // sign-on screen" bug (papabear 2026-07-23).
      res.setHeader("Set-Cookie", buildSessionCookie(shiftboardIdNew));

      return res.status(201).json(resAccount);
    }

    // default
    // ------------------------------------------------------------
    default: {
      // send error message
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default account;
