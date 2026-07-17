# CensusScheduler E2E Test Suite

End-to-end tests for the CensusScheduler app using [Playwright](https://playwright.dev/).

## Prerequisites

1. **Node.js 20+** installed
2. **MySQL** running locally with the `census` database and schema loaded
3. **Playwright browsers** installed:
   ```bash
   npx playwright install chromium
   ```

## Quick Start

```bash
cd CensusScheduler/client

# Run all tests (starts dev server automatically)
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# Run with Playwright UI (interactive mode)
npm run test:e2e:ui

# Run a single test file
npx playwright test --config=e2e/playwright.config.ts e2e/tests/18-vip-page.spec.ts

# Run tests matching a name pattern
npx playwright test --config=e2e/playwright.config.ts --grep "admin"
```

## How It Works

### Architecture

```
e2e/
  playwright.config.ts   # Playwright configuration
  helpers/
    db.ts                # Database helpers (insert/delete test data)
  fixtures/
    test-data.ts         # Test constants, data factories, UI helpers
  tests/
    01-account-creation.spec.ts
    02-sign-in.spec.ts
    ...
    18-vip-page.spec.ts
```

### Test Execution

- Tests run **sequentially** (1 worker) to avoid database conflicts
- Playwright automatically starts the Next.js dev server on port 3000
- If a dev server is already running on port 3000, Playwright reuses it (faster)
- Each test file has `beforeAll`/`afterAll` hooks that set up and tear down test data
- Test data uses **high IDs** (9,000,000+) to avoid collisions with real data

### Database

Tests directly insert/query the local MySQL `census` database. Connection defaults:
- Host: `127.0.0.1`
- Database: `census`
- User: `root`
- Password: from `TEST_MYSQL_PASSWORD` env var (or hardcoded default)

Override with environment variables:
```bash
TEST_MYSQL_HOST=localhost TEST_MYSQL_DATABASE=census_test npm run test:e2e
```

## Test Files

| # | File | What It Tests |
|---|------|--------------|
| 01 | account-creation | Create account with required/optional fields, validation errors, passcode rules |
| 02 | sign-in | Valid credentials, wrong passcode, volunteer dropdown, required fields |
| 03 | shift-signup | Browse shifts, admin adding volunteer to a shift |
| 04 | check-in | Check-in for current/future shifts |
| 05 | volunteer-account-update | Modifying volunteer account details |
| 06 | contact-form | Contact form submission and validation |
| 07 | shift-browsing | Shift listing and browsing |
| 08 | admin-volunteer-management | Admin CRUD operations on volunteers |
| 09 | admin-role-management | Role creation, assignment, display toggle, access control |
| 10 | admin-shift-categories | Shift category management |
| 11 | admin-shift-types | Shift type management |
| 12 | admin-shift-positions | Shift position management |
| 13 | volunteer-removal-from-shift | Removing volunteers from shifts |
| 14 | behavioral-standards | Behavioral standards feature |
| 15 | reports-page | Reports page functionality |
| 16 | help-page | Help page content |
| 17 | doodle | Doodle/poll feature |
| 18 | vip-page | VIP (Volunteer Info Page): UI sections, role toggles, API endpoints |

## Reading Test Results

### Terminal Output

After a test run, you'll see a summary like:

```
  18 passed (5.4m)
```

or with failures:

```
  2 failed
    [chromium] › e2e/tests/01-account-creation.spec.ts:45:7 › ... › test name
    [chromium] › e2e/tests/03-shift-signup.spec.ts:80:7 › ... › test name
  16 passed (6.1m)
```

Each failure shows:
- **File and line number** where the assertion failed
- **Expected vs Received** values
- **Call log** showing what Playwright was waiting for

### HTML Report

After each run, Playwright generates an HTML report:

```bash
npx playwright show-report --config=e2e/playwright.config.ts
```

This opens a browser with:
- Pass/fail status for every test
- Duration of each test
- For failures: screenshots, videos, and trace files

### Failure Artifacts

On failure, Playwright automatically captures:
- **Screenshot** of the page at the moment of failure
- **Video** of the entire test (retained on failure)
- **Trace** file on first retry (in CI)

These are saved in `test-results/` and linked in the HTML report.

### Common Failure Patterns

| Symptom | Likely Cause |
|---------|-------------|
| Timeout waiting for element | Page didn't load in time; check dev server is running and DB is seeded |
| "strict mode violation" | Selector matched multiple elements; make it more specific |
| Element not found | UI changed; update the selector in the test |
| Database error | Schema out of date; re-run migrations or reload schema |
| Auth spinner stuck | Cookie/session issue; clear browser state or check AuthGate |

## Writing New Tests

1. **Add test IDs** to `fixtures/test-data.ts` in the `IDS` object (use a new range)
2. **Create test data** in `beforeAll` using helpers from `helpers/db.ts`
3. **Clean up** in `afterAll` with `cleanupAllTestData()` + `closePool()`
4. **Use helpers**: `signInAs()`, `signInAsBuiltinAdmin()`, `navigateTo()` from fixtures
5. **Number your file** sequentially (e.g., `19-feature-name.spec.ts`)

Example skeleton:

```typescript
import { test, expect } from "@playwright/test";
import { insertVolunteer, assignRole, closePool, cleanupAllTestData } from "../helpers/db";
import { IDS, ADMIN_VOLUNTEER, ROLE_ADMIN_ID, signInAsBuiltinAdmin } from "../fixtures/test-data";

test.describe("My Feature", () => {
  test.beforeAll(async () => {
    await cleanupAllTestData();
    await insertVolunteer(ADMIN_VOLUNTEER);
    await assignRole(ADMIN_VOLUNTEER.shiftboardId, ROLE_ADMIN_ID);
  });

  test.afterAll(async () => {
    await cleanupAllTestData();
    await closePool();
  });

  test("should do something", async ({ page }) => {
    await signInAsBuiltinAdmin(page);
    await page.goto("/my-page");
    await expect(page.getByText("expected text")).toBeVisible({ timeout: 10_000 });
  });
});
```

## CI Integration

In CI, set `CI=true` to enable:
- 1 retry on failure
- Stricter `forbidOnly` (prevents `test.only` from being committed)
- Fresh dev server (no reuse)

```bash
CI=true npm run test:e2e
```
