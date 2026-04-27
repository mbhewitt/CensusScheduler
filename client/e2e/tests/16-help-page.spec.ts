import { test, expect } from "@playwright/test";

test.describe("Help Page", () => {
  test("should load the help page", async ({ page }) => {
    await page.goto("/help");

    await expect(page.getByText(/help|guide|instructions/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display help sections", async ({ page }) => {
    await page.goto("/help");

    // The help page should contain instruction sections
    // Check for common help topics based on the app features
    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();

    // Should have some meaningful content
    expect(pageContent!.length).toBeGreaterThan(100);
  });

  test("should be accessible without authentication", async ({ page }) => {
    // Navigate directly to help without signing in
    await page.goto("/help");

    // Should load successfully (not redirect to sign-in)
    await expect(page).toHaveURL(/\/help/);
    await expect(page.getByText(/help|guide|instructions/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
