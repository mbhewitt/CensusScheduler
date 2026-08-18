import mysql from "mysql2/promise";

// Test data uses high IDs to avoid collisions with real data
const TEST_ID_BASE = 9_000_000;
let testIdCounter = 0;

export function nextTestId(): number {
  testIdCounter += 1;
  return TEST_ID_BASE + testIdCounter;
}

export function resetTestIdCounter(): void {
  testIdCounter = 0;
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      connectionLimit: 5,
      database: process.env.TEST_MYSQL_DATABASE ?? "census",
      host: process.env.TEST_MYSQL_HOST ?? "127.0.0.1",
      // Optional — defaults to 3306 when unset (CI). Local e2e can target a
      // MariaDB container on another port.
      ...(process.env.TEST_MYSQL_PORT
        ? { port: Number(process.env.TEST_MYSQL_PORT) }
        : {}),
      password:
        process.env.TEST_MYSQL_PASSWORD ??
        "8WlkGLQSxHzndVE92EeLwKBaNllw000N3zBDWnapGk8=",
      user: process.env.TEST_MYSQL_USER ?? "root",
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ── Volunteers ──────────────────────────────────────────────

export interface TestVolunteer {
  shiftboardId: number;
  playaName: string;
  worldName: string;
  email: string;
  passcode: string;
  location?: string;
}

export async function insertVolunteer(v: TestVolunteer): Promise<void> {
  const db = getPool();
  await db.execute(
    `INSERT INTO op_volunteers
       (shiftboard_id, playa_name, world_name, email, passcode, location, create_volunteer)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      v.shiftboardId,
      v.playaName,
      v.worldName,
      v.email,
      v.passcode,
      v.location ?? "",
    ]
  );
}

export async function deleteVolunteer(
  shiftboardId: number
): Promise<void> {
  const db = getPool();
  await db.execute(
    "DELETE FROM op_volunteer_roles WHERE shiftboard_id = ?",
    [shiftboardId]
  );
  await db.execute(
    "DELETE FROM op_volunteer_shifts WHERE shiftboard_id = ?",
    [shiftboardId]
  );
  await db.execute("DELETE FROM op_volunteers WHERE shiftboard_id = ?", [
    shiftboardId,
  ]);
}

export async function setArrivalDate(
  shiftboardId: number,
  dateId: number | null
): Promise<void> {
  const db = getPool();
  await db.execute(
    "UPDATE op_volunteers SET arrival_date_id = ? WHERE shiftboard_id = ?",
    [dateId, shiftboardId]
  );
}

// ── Roles ───────────────────────────────────────────────────

export async function assignRole(
  shiftboardId: number,
  roleId: number
): Promise<void> {
  const db = getPool();
  await db.execute(
    `INSERT INTO op_volunteer_roles (shiftboard_id, role_id, add_role, remove_role)
     VALUES (?, ?, 1, 0)
     ON DUPLICATE KEY UPDATE add_role=1, remove_role=0`,
    [shiftboardId, roleId]
  );
}

export async function removeRole(
  shiftboardId: number,
  roleId: number
): Promise<void> {
  const db = getPool();
  await db.execute(
    "DELETE FROM op_volunteer_roles WHERE shiftboard_id = ? AND role_id = ?",
    [shiftboardId, roleId]
  );
}

export async function insertRole(
  roleId: number,
  roleName: string
): Promise<void> {
  const db = getPool();
  await db.execute(
    `INSERT INTO op_roles (role_id, role, display, create_role)
     VALUES (?, ?, 1, 1)`,
    [roleId, roleName]
  );
}

export async function deleteRole(roleId: number): Promise<void> {
  const db = getPool();
  await db.execute(
    "DELETE FROM op_volunteer_roles WHERE role_id = ?",
    [roleId]
  );
  await db.execute("DELETE FROM op_roles WHERE role_id = ?", [roleId]);
}

export async function deleteRoleByName(roleName: string): Promise<void> {
  const db = getPool();
  await db.execute(
    "DELETE FROM op_volunteer_roles WHERE role_id IN (SELECT role_id FROM op_roles WHERE role = ?)",
    [roleName]
  );
  await db.execute("DELETE FROM op_roles WHERE role = ?", [roleName]);
}

// ── Shifts ──────────────────────────────────────────────────

export interface TestShiftSetup {
  categoryId: number;
  categoryName: string;
  department: string;
  shiftNameId: number;
  shiftName: string;
  shiftTimesId: number;
  startTime: string; // "YYYY-MM-DD HH:mm"
  endTime: string;
  positionTypeId: number;
  positionName: string;
  timePositionId: number;
  slots: number;
}

export async function insertFullShift(s: TestShiftSetup): Promise<void> {
  const db = getPool();

  // Category
  await db.execute(
    `INSERT IGNORE INTO op_shift_category
       (shift_category_id, shift_category, department, create_category)
     VALUES (?, ?, ?, 1)`,
    [s.categoryId, s.categoryName, s.department]
  );

  // Position type
  await db.execute(
    `INSERT IGNORE INTO op_position_type
       (position_type_id, position, create_position)
     VALUES (?, ?, 1)`,
    [s.positionTypeId, s.positionName]
  );

  // Shift name (off_playa must be false for shift to appear in list)
  await db.execute(
    `INSERT IGNORE INTO op_shift_name
       (shift_name_id, shift_name, shift_category_id, off_playa, delete_shift, create_shift)
     VALUES (?, ?, ?, 0, 0, 1)`,
    [s.shiftNameId, s.shiftName, s.categoryId]
  );

  // Shift time (remove_shift_time must be false)
  await db.execute(
    `INSERT IGNORE INTO op_shift_times
       (shift_times_id, shift_name_id, start_time, end_time, remove_shift_time, add_shift_time)
     VALUES (?, ?, ?, ?, 0, 1)`,
    [s.shiftTimesId, s.shiftNameId, s.startTime, s.endTime]
  );

  // Time-position (the slot; remove_time_position must be false)
  await db.execute(
    `INSERT IGNORE INTO op_shift_time_position
       (time_position_id, shift_times_id, position_type_id, slots, remove_time_position, add_time_position)
     VALUES (?, ?, ?, ?, 0, 1)`,
    [s.timePositionId, s.shiftTimesId, s.positionTypeId, s.slots]
  );
}

export async function deleteFullShift(s: TestShiftSetup): Promise<void> {
  const db = getPool();
  await db.execute(
    "DELETE FROM op_volunteer_shifts WHERE time_position_id = ?",
    [s.timePositionId]
  );
  await db.execute(
    "DELETE FROM op_shift_time_position WHERE time_position_id = ?",
    [s.timePositionId]
  );
  await db.execute(
    "DELETE FROM op_shift_times WHERE shift_times_id = ?",
    [s.shiftTimesId]
  );
  await db.execute(
    "DELETE FROM op_shift_name WHERE shift_name_id = ?",
    [s.shiftNameId]
  );
  await db.execute(
    "DELETE FROM op_position_type WHERE position_type_id = ?",
    [s.positionTypeId]
  );
  await db.execute(
    "DELETE FROM op_shift_category WHERE shift_category_id = ?",
    [s.categoryId]
  );
}

export async function insertVolunteerShift(
  shiftboardId: number,
  timePositionId: number,
  noshow: string = "X"
): Promise<void> {
  const db = getPool();
  await db.execute(
    `INSERT IGNORE INTO op_volunteer_shifts
       (shiftboard_id, time_position_id, noshow, add_shift)
     VALUES (?, ?, ?, 1)`,
    [shiftboardId, timePositionId, noshow]
  );
}

export async function deleteVolunteerShift(
  shiftboardId: number,
  timePositionId: number
): Promise<void> {
  const db = getPool();
  await db.execute(
    "DELETE FROM op_volunteer_shifts WHERE shiftboard_id = ? AND time_position_id = ?",
    [shiftboardId, timePositionId]
  );
}

// ── Messages ────────────────────────────────────────────────

export async function deleteTestMessages(name: string): Promise<void> {
  const db = getPool();
  await db.execute("DELETE FROM op_messages WHERE name = ?", [name]);
}

// ── Email queue (offline-link, #643) ────────────────────────

export async function countQueuedOfflineLinks(to: string): Promise<number> {
  const db = getPool();
  const [rows] = await db.query(
    "SELECT COUNT(*) AS n FROM op_email_queue WHERE category = 'offline-link' AND `to` = ?",
    [to]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Number((rows as any[])[0]?.n ?? 0);
}

export async function deleteOfflineLinkEmails(to: string): Promise<void> {
  const db = getPool();
  await db.execute(
    "DELETE FROM op_email_queue WHERE category = 'offline-link' AND `to` = ?",
    [to]
  );
}

// ── Generic cleanup by high IDs ─────────────────────────────

export async function cleanupAllTestData(): Promise<void> {
  const db = getPool();
  const base = TEST_ID_BASE;

  // Order matters due to foreign keys
  await db.execute(
    "DELETE FROM op_volunteer_shifts WHERE shiftboard_id >= ?",
    [base]
  );
  await db.execute(
    "DELETE FROM op_volunteer_roles WHERE shiftboard_id >= ?",
    [base]
  );
  await db.execute(
    "DELETE FROM op_volunteer_roles WHERE role_id >= ?",
    [base]
  );
  await db.execute("DELETE FROM op_volunteers WHERE shiftboard_id >= ?", [
    base,
  ]);
  await db.execute(
    "DELETE FROM op_shift_time_position WHERE time_position_id >= ?",
    [base]
  );
  await db.execute(
    "DELETE FROM op_shift_times WHERE shift_times_id >= ?",
    [base]
  );
  await db.execute(
    "DELETE FROM op_shift_name WHERE shift_name_id >= ?",
    [base]
  );
  await db.execute(
    "DELETE FROM op_position_type WHERE position_type_id >= ?",
    [base]
  );
  await db.execute(
    "DELETE FROM op_shift_category WHERE shift_category_id >= ?",
    [base]
  );
  // Shift metadata created through the admin UI (e.g. spec 10's "create
  // category") gets a DB-assigned ID *below* TEST_ID_BASE, so the id-based
  // deletes above miss it. op_shift_category/op_position_type/op_shift_name have
  // UNIQUE name columns, so a leftover 'E2E %' row silently makes a later
  // INSERT IGNORE skip (dup-name) and FK-cascades the whole shift fixture away —
  // breaking a downstream spec (e.g. 14 seeing an empty CURRENT_SHIFT). Delete
  // by the test-name prefix too, children before parents.
  await db.execute(
    "DELETE stp FROM op_shift_time_position stp JOIN op_shift_times st ON st.shift_times_id = stp.shift_times_id JOIN op_shift_name sn ON sn.shift_name_id = st.shift_name_id WHERE sn.shift_name LIKE 'E2E %'"
  );
  await db.execute(
    "DELETE st FROM op_shift_times st JOIN op_shift_name sn ON sn.shift_name_id = st.shift_name_id WHERE sn.shift_name LIKE 'E2E %'"
  );
  await db.execute("DELETE FROM op_shift_name WHERE shift_name LIKE 'E2E %'");
  await db.execute("DELETE FROM op_position_type WHERE position LIKE 'E2E %'");
  await db.execute(
    "DELETE FROM op_shift_category WHERE shift_category LIKE 'E2E %'"
  );
  await db.execute("DELETE FROM op_roles WHERE role_id >= ?", [base]);
  // Clean up roles created through the UI (have DB-assigned IDs, not test IDs)
  await db.execute(
    "DELETE FROM op_volunteer_roles WHERE role_id IN (SELECT role_id FROM op_roles WHERE role LIKE 'E2E %')",
    []
  );
  await db.execute("DELETE FROM op_roles WHERE role LIKE 'E2E %'", []);
  await db.execute("DELETE FROM op_messages WHERE name LIKE ?", [
    "E2E Test%",
  ]);
}
