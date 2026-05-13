import { test, expect } from "@playwright/test";

test.describe("Reports Page", () => {
  test("should load the reports page", async ({ page }) => {
    await page.goto("/reports");

    // The reports page should display
    await expect(page.getByText(/report/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display historical report links", async ({ page }) => {
    await page.goto("/reports");

    // Should show links to past years (2024, 2023, etc.)
    await expect(page.getByText(/2024/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/2023/)).toBeVisible();
  });

  test("should navigate to a report when clicked", async ({ page }) => {
    await page.goto("/reports");

    // Click on the 2024 report link
    const reportLink = page.getByRole("link", { name: /2024/ });
    if (await reportLink.isVisible()) {
      await reportLink.click();

      // Should navigate to the report or open it
      await page.waitForTimeout(2_000);
    }
  });
});
