import dayjs from "dayjs";
import type { Page } from "@playwright/test";
import type { TestVolunteer, TestShiftSetup } from "../helpers/db";

// ── Role IDs (must match app constants) ─────────────────────
export const ROLE_SUPER_ADMIN_ID = 1;
export const ROLE_ADMIN_ID = 2;
export const ROLE_CORE_CREW_ID = 13184;
export const ROLE_BEHAVIORAL_STANDARDS_ID = 1000012;

// ── Test ID ranges ──────────────────────────────────────────
// Each suite gets its own ID range to avoid collisions when running in sequence
const BASE = 9_000_000;

export const IDS = {
  // Suite 1 & 2: account creation + sign-in
  volunteer1: BASE + 1,
  volunteer2: BASE + 2,
  volunteer3: BASE + 3,

  // Suite 3 & 4: shift signup + check-in
  shiftVolunteer: BASE + 10,
  adminVolunteer: BASE + 11,

  // Suite 5: account update
  updateVolunteer: BASE + 20,

  // Suite 8: admin volunteer management
  adminMgmtVolunteer: BASE + 30,

  // Suite 9: role management
  testRole1: BASE + 100,
  testRole2: BASE + 101,
  roleVolunteer: BASE + 31,

  // Suite 10-12: shift management
  testCategory: BASE + 200,
  testShiftName: BASE + 201,
  testShiftTime: BASE + 202,
  testPositionType: BASE + 203,
  testTimePosition: BASE + 204,
  testCategory2: BASE + 210,
  testShiftName2: BASE + 211,
  testShiftTime2: BASE + 212,
  testPositionType2: BASE + 213,
  testTimePosition2: BASE + 214,

  // Suite 13: volunteer removal
  removalVolunteer: BASE + 40,

  // Suite 14: behavioral standards
  behavioralVolunteer: BASE + 50,

  // Suite 18: VIP page
  vipVolunteer: BASE + 60,
  vipShiftCategory: BASE + 300,
  vipShiftName: BASE + 301,
  vipShiftTime: BASE + 302,
  vipPositionType: BASE + 303,
  vipTimePosition: BASE + 304,
} as const;

// ── Test Volunteers ─────────────────────────────────────────

export function makeTestVolunteer(
  overrides: Partial<TestVolunteer> & { shiftboardId: number }
): TestVolunteer {
  return {
    playaName: `E2E Tester ${overrides.shiftboardId}`,
    worldName: `Test World ${overrides.shiftboardId}`,
    email: `e2e-${overrides.shiftboardId}@test.local`,
    passcode: "1234",
    phone: "555-0100",
    location: "Test Camp",
    emergencyContact: "Test Contact 555-0199",
    ...overrides,
  };
}

export const ADMIN_VOLUNTEER: TestVolunteer = makeTestVolunteer({
  shiftboardId: IDS.adminVolunteer,
  playaName: "E2E Admin",
  worldName: "Admin Tester",
  email: "e2e-admin@test.local",
  passcode: "9999",
});

export const SHIFT_VOLUNTEER: TestVolunteer = makeTestVolunteer({
  shiftboardId: IDS.shiftVolunteer,
  playaName: "E2E Shifty",
  worldName: "Shift Tester",
  email: "e2e-shift@test.local",
  passcode: "4321",
});

// ── Test Shift ──────────────────────────────────────────────

// A shift happening "right now" for check-in tests
function makeCurrentShift(): TestShiftSetup {
  const now = dayjs();
  const start = now.subtract(1, "hour").format("YYYY-MM-DD HH:mm");
  const end = now.add(3, "hour").format("YYYY-MM-DD HH:mm");

  return {
    categoryId: IDS.testCategory,
    categoryName: "E2E Test Category",
    department: "E2E Testing",
    shiftNameId: IDS.testShiftName,
    shiftName: "E2E Test Shift",
    shiftTimesId: IDS.testShiftTime,
    startTime: start,
    endTime: end,
    positionTypeId: IDS.testPositionType,
    positionName: "E2E Tester Position",
    timePositionId: IDS.testTimePosition,
    slots: 5,
  };
}

// A shift in the future for signup tests
function makeFutureShift(): TestShiftSetup {
  const future = dayjs().add(7, "day");
  const start = future
    .set("hour", 10)
    .set("minute", 0)
    .format("YYYY-MM-DD HH:mm");
  const end = future
    .set("hour", 14)
    .set("minute", 0)
    .format("YYYY-MM-DD HH:mm");

  return {
    categoryId: IDS.testCategory2,
    categoryName: "E2E Future Category",
    department: "E2E Testing",
    shiftNameId: IDS.testShiftName2,
    shiftName: "E2E Future Shift",
    shiftTimesId: IDS.testShiftTime2,
    startTime: start,
    endTime: end,
    positionTypeId: IDS.testPositionType2,
    positionName: "E2E Future Position",
    timePositionId: IDS.testTimePosition2,
    slots: 3,
  };
}

export const CURRENT_SHIFT = makeCurrentShift();
export const FUTURE_SHIFT = makeFutureShift();

// ── Helper: Fill the volunteer autocomplete on sign-in ──────

async function fillVolunteerAutocomplete(
  page: Page,
  searchText: string
): Promise<void> {
  // Use the combobox role to target the actual input (avoids matching the listbox too)
  const volunteerInput = page.getByRole("combobox", { name: "Volunteer" });
  await volunteerInput.click();
  await volunteerInput.fill(searchText);

  // Wait for and select the matching option from the dropdown
  const option = page.getByRole("option", {
    name: new RegExp(searchText, "i"),
  });
  await option.first().click();
}

// ── Helper: Sign in via UI ──────────────────────────────────

/**
 * Sign in as a volunteer through the UI.
 * Assumes the volunteer already exists in the database.
 */
export async function signInAs(
  page: Page,
  volunteer: TestVolunteer
): Promise<void> {
  await page.goto("/sign-in");

  await fillVolunteerAutocomplete(page, volunteer.playaName);

  // Password fields need locator by name (type=password has no textbox role)
  await page.locator('input[name="passcode"]').fill(volunteer.passcode);

  // Submit
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for navigation away from sign-in
  await page.waitForURL(/\/volunteers\/\d+\/account/, { timeout: 10_000 });
}

/**
 * Sign in as admin (uses the built-in Admin account from schema seed).
 */
export async function signInAsBuiltinAdmin(page: Page): Promise<void> {
  await page.goto("/sign-in");

  await fillVolunteerAutocomplete(page, "Admin");

  await page.locator('input[name="passcode"]').fill("123456");

  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/volunteers\/\d+\/account/, { timeout: 10_000 });
}

/**
 * Open the navigation drawer and click a link.
 */
export async function navigateTo(
  page: Page,
  linkName: string
): Promise<void> {
  // Open the drawer by clicking the menu icon
  const menuButton = page.locator('[aria-label="menu"]');
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
  await page.getByRole("button", { name: linkName }).first().click();
}
