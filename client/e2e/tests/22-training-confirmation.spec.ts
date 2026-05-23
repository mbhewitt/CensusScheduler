// /api/training/confirmation/[code] sanity tests.
//
// Seeds two volunteers (one to assign the role to; one for an admin
// session) and uses the "Census Basics" training row that ships with the
// schema seed (code XQDDG, role_id 2000001). Confirms GET → 200 with
// expected shape, POST → 201 + role written, GET-after-POST →
// alreadyConfirmed:true, POST is idempotent.

import { test, expect, request } from "@playwright/test";

import { closePool, cleanupAllTestData, getPool, insertVolunteer } from "../helpers/db";
import { buildSessionCookieHeader } from "../helpers/session";
import { IDS, makeTestVolunteer } from "../fixtures/test-data";

const TRAINING_CODE = "XQDDG";
const TRAINING_ROLE_ID = 2000001;

const seedVolunteer = makeTestVolunteer({
  shiftboardId: IDS.volunteer1,
  playaName: "E2E TrainingProbe",
  worldName: "Training Probe",
  email: "e2e-training@test.local",
  passcode: "0000",
});

test.describe("Training confirmation endpoint", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(seedVolunteer);
    // ensure the training role/training row exist (idempotent re-seed)
    const db = getPool();
    await db.execute(
      `INSERT IGNORE INTO op_roles (role_id, role, display, create_role, delete_role, role_src)
       VALUES (?, 'TrainingCensusBasicsComplete', 0, 1, 0, 'tablet')`,
      [TRAINING_ROLE_ID]
    );
    await db.execute(
      `INSERT IGNORE INTO op_trainings (training_name, role_id, code, url, create_training)
       VALUES ('Census Basics', ?, ?, '', 1)`,
      [TRAINING_ROLE_ID, TRAINING_CODE]
    );
    // make sure the volunteer doesn't already hold the role from a prior run
    await db.execute(
      `DELETE FROM op_volunteer_roles WHERE shiftboard_id = ? AND role_id = ?`,
      [seedVolunteer.shiftboardId, TRAINING_ROLE_ID]
    );
  });

  test.afterAll(async () => {
    const db = getPool();
    await db.execute(
      `DELETE FROM op_volunteer_roles WHERE shiftboard_id = ? AND role_id = ?`,
      [seedVolunteer.shiftboardId, TRAINING_ROLE_ID]
    );
    await cleanupAllTestData();
    await closePool();
  });

  async function authedContext() {
    return request.newContext({
      baseURL: "http://localhost:3000",
      extraHTTPHeaders: {
        Cookie: buildSessionCookieHeader(seedVolunteer.shiftboardId),
      },
    });
  }

  test("GET with valid code returns training + alreadyConfirmed=false", async () => {
    const ctx = await authedContext();
    const res = await ctx.get(
      `/api/training/confirmation/${TRAINING_CODE}`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    await ctx.dispose();

    expect(body.training.name).toBe("Census Basics");
    expect(body.training.roleId).toBe(TRAINING_ROLE_ID);
    expect(body.training.roleName).toBe("TrainingCensusBasicsComplete");
    expect(body.volunteer.playaName).toBe(seedVolunteer.playaName);
    expect(body.alreadyConfirmed).toBe(false);
    expect(Array.isArray(body.availableShifts)).toBe(true);
  });

  test("GET with unknown code returns 404", async () => {
    const ctx = await authedContext();
    const res = await ctx.get(
      `/api/training/confirmation/this-code-does-not-exist`
    );
    const status = res.status();
    await ctx.dispose();
    expect(status).toBe(404);
  });

  test("unauthenticated request gets 401 (withAuth gate)", async ({
    request: req,
  }) => {
    const res = await req.get(`/api/training/confirmation/${TRAINING_CODE}`);
    expect(res.status()).toBe(401);
  });

  test("POST assigns the role; subsequent GET shows alreadyConfirmed; idempotent", async () => {
    const ctx = await authedContext();

    const post = await ctx.post(`/api/training/confirmation/${TRAINING_CODE}`, {
      data: { shiftboardId: seedVolunteer.shiftboardId },
    });
    expect([200, 201]).toContain(post.status());

    const get = await ctx.get(
      `/api/training/confirmation/${TRAINING_CODE}`
    );
    expect(get.status()).toBe(200);
    const body = await get.json();
    expect(body.alreadyConfirmed).toBe(true);

    const post2 = await ctx.post(`/api/training/confirmation/${TRAINING_CODE}`, {
      data: { shiftboardId: seedVolunteer.shiftboardId },
    });
    expect([200, 201]).toContain(post2.status());

    await ctx.dispose();
  });
});
