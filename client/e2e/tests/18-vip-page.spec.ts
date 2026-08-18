import { test, expect, request } from "@playwright/test";
import dayjs from "dayjs";
import {
  insertVolunteer,
  insertFullShift,
  insertVolunteerShift,
  assignRole,
  removeRole,
  setArrivalDate,
  closePool,
  cleanupAllTestData,
} from "../helpers/db";
import {
  IDS,
  ADMIN_VOLUNTEER,
  ROLE_ADMIN_ID,
  ROLE_SUPER_ADMIN_ID,
  ROLE_BEHAVIORAL_STANDARDS_ID,
  makeTestVolunteer,
  signInAs,
  signInAsBuiltinAdmin,
} from "../fixtures/test-data";
import { buildSessionCookieHeader } from "../helpers/session";

// Role IDs matching the app
const ROLE_STAFF_ID = 2000006;
const ROLE_OTHER_SAP_ID = 2000007;

// op_dates date_id values (from database seed)
const DATE_ID_PRE_WED = 8;
const DATE_ID_MON = 13; // post-opening

// Blank location so the "on-playa plans" checklist item stays INCOMPLETE and
// therefore expanded by default (plansDone = arrivalDate && location). That
// keeps the arrival-date / early-entry fields visible without having to open
// the "completed items" accordion in every UI test.
const vipVolunteer = makeTestVolunteer({
  shiftboardId: IDS.vipVolunteer,
  playaName: "E2E VipVol",
  worldName: "VIP Tester",
  email: "e2e-vip@test.local",
  passcode: "7777",
  location: "",
});

function makeVipShift() {
  const future = dayjs().add(3, "day");
  const start = future
    .set("hour", 8)
    .set("minute", 0)
    .format("YYYY-MM-DD HH:mm");
  const end = future
    .set("hour", 12)
    .set("minute", 0)
    .format("YYYY-MM-DD HH:mm");

  return {
    categoryId: IDS.vipShiftCategory,
    categoryName: "E2E VIP Category",
    department: "E2E VIP Testing",
    shiftNameId: IDS.vipShiftName,
    shiftName: "E2E VIP Shift",
    shiftTimesId: IDS.vipShiftTime,
    startTime: start,
    endTime: end,
    positionTypeId: IDS.vipPositionType,
    positionName: "E2E VIP Position",
    timePositionId: IDS.vipTimePosition,
    slots: 5,
  };
}

const VIP_SHIFT = makeVipShift();

// Authenticated request contexts for the API tests. The info/* endpoints are
// behind withAuth + isOwnerOrAdmin, so a bare `request` fixture (no cookie)
// gets 401 and body.sapStatus is undefined. We sign a session cookie the same
// way the dev server verifies it (see e2e/helpers/session.ts).
async function vipContext() {
  return request.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: {
      Cookie: buildSessionCookieHeader(vipVolunteer.shiftboardId),
    },
  });
}

// Admin session — needed to read a record that isn't the caller's own (the
// 404 test hits a nonexistent volunteer; isOwnerOrAdmin would 403 a
// non-admin before the handler can 404).
async function adminContext() {
  return request.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: {
      Cookie: buildSessionCookieHeader(ADMIN_VOLUNTEER.shiftboardId),
    },
  });
}

test.describe("VIP Page", () => {
  // VIP page UI tests need extra time due to sign-in + page load
  test.setTimeout(60_000);

  test.beforeAll(async () => {
    await cleanupAllTestData();

    // Set up admin
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_SUPER_ADMIN_ID);

    // Set up VIP volunteer with pre-event arrival and a shift
    await insertVolunteer(vipVolunteer);
    await setArrivalDate(vipVolunteer.shiftboardId, DATE_ID_PRE_WED);
    await assignRole(
      vipVolunteer.shiftboardId,
      ROLE_BEHAVIORAL_STANDARDS_ID
    );
    // Ensure OtherSAP is not set (clean state)
    await removeRole(vipVolunteer.shiftboardId, ROLE_OTHER_SAP_ID);
    await insertFullShift(VIP_SHIFT);
    await insertVolunteerShift(
      vipVolunteer.shiftboardId,
      VIP_SHIFT.timePositionId,
      ""
    );
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  // ── Page load ────────────────────────────────────────────

  test("VIP page loads for authenticated volunteer", async ({ page }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // Volunteer name should appear in the hero heading
    // Longer timeout for first page load (cold start)
    await expect(
      page.getByRole("heading", { name: new RegExp(vipVolunteer.playaName) }).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("VIP page shows on-playa plans (arrival + early entry)", async ({
    page,
  }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // On-playa arrival/early-entry now live INLINE in the checklist (#461),
    // not under a separate "On-Playa Information" heading. The plans item is
    // incomplete (blank location) so it's expanded by default.
    await expect(
      page.getByText(/Desired \/ Expected Arrival Date/i).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Early Entry/i).first()).toBeVisible();
  });

  // ── Arrival date ─────────────────────────────────────────

  test("arrival date dropdown shows selected date", async ({ page }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // PreWed should be visible in the dropdown (value = date_id 8)
    await expect(page.getByText(/PreWed/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── Checklist ────────────────────────────────────────────

  test("checklist shows behavioral standards as complete", async ({
    page,
  }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // Behavioral standards role was assigned, so it shows in the completed
    // accordion, labelled "View N completed item(s)".
    const completedAccordion = page.getByText(/view \d+ completed item/i);
    await expect(completedAccordion).toBeVisible({ timeout: 10_000 });
    await completedAccordion.click();
    await expect(
      page.getByText(/behavioral standards/i).first()
    ).toBeVisible();
  });

  test("checklist shows SAP requirements for pre-event arrival", async ({
    page,
  }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // PreWed arrival should show the SAP shift requirements checklist item
    await expect(
      page.getByText(/pre-event shifts to earn a Census SAP/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Early entry question ─────────────────────────────────

  test("early entry dropdown defaults to Census", async ({ page }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // The early entry select should show the Census option by default
    await expect(
      page.getByText(/I would like Census to provide early entry/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("toggling Other SAP updates the early entry dropdown", async ({
    page,
  }) => {
    // Reset OtherSAP state via API first
    await removeRole(vipVolunteer.shiftboardId, ROLE_OTHER_SAP_ID);

    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // Wait for the early entry select to be visible
    const earlyEntrySelect = page.locator('[role="combobox"]').filter({
      hasText: /Census to provide/i,
    });
    await expect(earlyEntrySelect).toBeVisible({ timeout: 10_000 });

    // Toggle to "other department"
    await earlyEntrySelect.click();
    await page
      .getByRole("option", {
        name: /already have early entry through another department/i,
      })
      .click();

    // Should see success snackbar
    await expect(page.getByText(/updated/i).first()).toBeVisible({
      timeout: 5_000,
    });

    // Reset: switch back to Census
    const updatedSelect = page.locator('[role="combobox"]').filter({
      hasText: /another department/i,
    });
    await updatedSelect.click();
    await page
      .getByRole("option", {
        name: /I would like Census to provide early entry/i,
      })
      .click();
  });

  // ── Burner Profile link ──────────────────────────────────

  test("Burner Profile link is present", async ({ page }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    const link = page.getByRole("link", {
      name: /burner profile/i,
    });
    await expect(link.first()).toBeVisible({ timeout: 10_000 });
    await expect(link.first()).toHaveAttribute(
      "href",
      /profiles\.burningman\.org/
    );
  });

  // ── Shifts section ───────────────────────────────────────

  test("shifts section shows volunteer shifts", async ({ page }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // The shift we assigned should appear
    await expect(
      page.getByText("E2E VIP Position").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Admin sections ───────────────────────────────────────

  test("admin sees roles section with role toggle", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // Admin sections should be visible
    await expect(
      page.getByText(/^Roles$/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Should see the behavioral standards role as active
    await expect(
      page.getByText(/signed behavioral standards/i).first()
    ).toBeVisible();
  });

  test("admin can toggle a role on and off", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // Wait for roles to load
    await expect(
      page.getByText(/^Roles$/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Find an inactive role and click to add it
    const coreCrewText = page.getByText("Core Crew");
    await expect(coreCrewText.first()).toBeVisible({ timeout: 10_000 });
    await coreCrewText.first().click();

    // Should see success snackbar
    await expect(
      page.getByText(/has been added/i)
    ).toBeVisible({ timeout: 5_000 });

    // Now remove it
    await page.getByText("Core Crew").first().click();

    await expect(
      page.getByText(/has been removed/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("admin cannot remove Admin or SuperAdmin roles", async ({ page }) => {
    await signInAsBuiltinAdmin(page);

    // View the built-in admin's own VIP page
    await page.goto("/volunteers/1/info");

    // Wait for roles to load
    await expect(
      page.getByText(/^Roles$/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Admin and SuperAdmin should show "protected" label
    await expect(
      page.getByText("protected").first()
    ).toBeVisible();
  });

  // ── Non-admin restrictions ───────────────────────────────

  test("non-admin does not see admin sections", async ({ page }) => {
    await signInAs(page, vipVolunteer);

    await page.goto(`/volunteers/${vipVolunteer.shiftboardId}/info`);

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: new RegExp(vipVolunteer.playaName) }).first()
    ).toBeVisible({ timeout: 10_000 });

    // Admin-only sections should NOT be visible
    await expect(
      page.getByRole("heading", { name: /^Notes$/i })
    ).not.toBeVisible();
  });

  // ── API: VIP info endpoint ───────────────────────────────

  test("VIP API returns volunteer data", async () => {
    const ctx = await vipContext();
    const res = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    await ctx.dispose();

    expect(body.volunteer.shiftboardId).toBe(vipVolunteer.shiftboardId);
    expect(body.volunteer.playaName).toBe(vipVolunteer.playaName);
    expect(body.arrivalDate).not.toBeNull();
    expect(body.arrivalDate.datename).toBe("PreWed");
    expect(body.sapStatus).toBeDefined();
    expect(body.sapStatus.bypass).toBe(false);
    expect(body.sapStatus.requiredDays).toHaveLength(3); // PreThur, PreFri, PreSat/OpenSun
    expect(body.roles).toContain("Signed Behavioral Standards");
  });

  test("VIP API returns 404 for nonexistent volunteer", async () => {
    // Use an admin session: isOwnerOrAdmin would 403 a non-admin before the
    // handler reaches its 404 branch.
    const ctx = await adminContext();
    const res = await ctx.get("/api/volunteers/999999999/info");
    const status = res.status();
    await ctx.dispose();
    expect(status).toBe(404);
  });

  test("VIP API PATCH updates arrival date", async () => {
    const ctx = await vipContext();
    const res = await ctx.patch(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`,
      {
        data: JSON.stringify({ arrivalDateId: DATE_ID_MON }),
      }
    );
    expect(res.ok()).toBeTruthy();

    // Verify the change
    const getRes = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    const body = await getRes.json();
    expect(body.arrivalDate.datename).toBe("Mon");

    // Post-opening arrival should bypass SAP
    expect(body.sapStatus.bypass).toBe(true);
    expect(body.sapStatus.bypassReason).toBe("post_opening");

    // Reset arrival date back
    await ctx.patch(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`,
      {
        data: JSON.stringify({ arrivalDateId: DATE_ID_PRE_WED }),
      }
    );
    await ctx.dispose();
  });

  // ── SAP bypass states ────────────────────────────────────

  test("Staff role triggers SAP bypass", async () => {
    await assignRole(vipVolunteer.shiftboardId, ROLE_STAFF_ID);

    const ctx = await vipContext();
    const res = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    const body = await res.json();
    await ctx.dispose();
    expect(body.sapStatus.bypass).toBe(true);
    expect(body.sapStatus.bypassReason).toBe("staff");

    await removeRole(vipVolunteer.shiftboardId, ROLE_STAFF_ID);
  });

  test("OtherSAP role triggers SAP bypass", async () => {
    await assignRole(vipVolunteer.shiftboardId, ROLE_OTHER_SAP_ID);

    const ctx = await vipContext();
    const res = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    const body = await res.json();
    await ctx.dispose();
    expect(body.sapStatus.bypass).toBe(true);
    expect(body.sapStatus.bypassReason).toBe("other_sap");

    await removeRole(vipVolunteer.shiftboardId, ROLE_OTHER_SAP_ID);
  });

  // ── Profile updated toggle ───────────────────────────────

  test("profile-updated API toggles role", async () => {
    const ctx = await vipContext();

    // Enable
    const onRes = await ctx.post(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info/profile-updated`,
      { data: JSON.stringify({ updated: true }) }
    );
    expect(onRes.status()).toBe(201);

    let getRes = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    let body = await getRes.json();
    expect(body.burnerProfileUpdated).toBe(true);

    // Disable
    const offRes = await ctx.post(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info/profile-updated`,
      { data: JSON.stringify({ updated: false }) }
    );
    // updated:false DELETEs the role row and returns 200 (not 201).
    expect(offRes.status()).toBe(200);

    getRes = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    body = await getRes.json();
    expect(body.burnerProfileUpdated).toBe(false);

    await ctx.dispose();
  });

  // ── Other SAP toggle API ─────────────────────────────────

  test("other-sap API toggles role", async () => {
    const ctx = await vipContext();

    // Enable
    const onRes = await ctx.post(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info/other-sap`,
      { data: JSON.stringify({ hasOtherSap: true }) }
    );
    expect(onRes.status()).toBe(201);

    let getRes = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    let body = await getRes.json();
    expect(body.sapStatus.bypass).toBe(true);
    expect(body.sapStatus.bypassReason).toBe("other_sap");

    // Disable
    await ctx.post(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info/other-sap`,
      { data: JSON.stringify({ hasOtherSap: false }) }
    );

    getRes = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/info`
    );
    body = await getRes.json();
    expect(body.sapStatus.bypass).toBe(false);

    await ctx.dispose();
  });

  // ── SAP download endpoint ────────────────────────────────

  test("SAP download returns 404 for nonexistent SAP", async () => {
    const ctx = await vipContext();
    const res = await ctx.get(
      `/api/volunteers/${vipVolunteer.shiftboardId}/sap/999999`
    );
    const status = res.status();
    await ctx.dispose();
    expect(status).toBe(404);
  });
});
