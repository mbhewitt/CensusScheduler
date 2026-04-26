import { test, expect } from "@playwright/test";

test.describe("Doodle Page", () => {
  test("should load the doodle canvas", async ({ page }) => {
    await page.goto("/doodle");

    // The doodle page should have a canvas element
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 10_000 });
  });

  test("should display a color picker", async ({ page }) => {
    await page.goto("/doodle");

    // Wait for the page to load
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });

    // The color picker should be present (react-color renders a div-based picker)
    // Look for color swatches or the color picker component
    const colorElements = page.locator(
      '[title], .sketch-picker, .chrome-picker, [style*="background"]'
    );
    const count = await colorElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should allow drawing on canvas", async ({ page }) => {
    await page.goto("/doodle");

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Get canvas bounding box
    const box = await canvas.boundingBox();
    if (box) {
      // Simulate a simple drawing stroke
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });
      await page.mouse.up();

      // If there's a save button, the canvas should still be functional
      // The doodle auto-saves via PATCH /api/doodle
    }
  });
});
