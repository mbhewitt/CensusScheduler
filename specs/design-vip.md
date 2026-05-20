# Volunteer Info Page (VIP) Spec

**Status:** Draft
**Date:** 2026-04-16

---

## Overview

A new self-service page in CensusScheduler where volunteers can view their SAP (Setup
Access Pass) eligibility, shift requirements, training status, and update their arrival
preferences.

This document covers:

1. **Schema changes** — new table, altered tables, seed data
2. **SAP eligibility rules** — Census Shift Points (CSP) and day-by-day requirements
3. **VIP page layout** — section-by-section spec with exact UI copy
4. **Existing page changes** — CSP display on shifts pages, training multi-select
5. **API routes** — new Next.js Pages Router endpoints
6. **Implementation order**

**Scope:** Only `op_*` tables.

---

## Database Changes

### New Table: `op_saps`

Stores issued SAP PDF files. Once `shiftboard_id` is set, the volunteer sees a download
link on their VIP.

```sql
CREATE TABLE op_saps (
    sap_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename        VARCHAR(256) NOT NULL,
    shiftboard_id   BIGINT NULL,
    date_id         BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_sap_volunteer (shiftboard_id),
    KEY idx_sap_date (date_id),
    FOREIGN KEY (shiftboard_id) REFERENCES op_volunteers(shiftboard_id),
    FOREIGN KEY (date_id)       REFERENCES op_dates(date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| Column | Type | Purpose |
|--------|------|---------|
| `sap_id` | BIGINT AUTO_INCREMENT | PK (let MySQL assign -- do not use `generateId()`) |
| `filename` | VARCHAR(256) | Hashed filename of the SAP PDF |
| `shiftboard_id` | BIGINT FK NULL | Volunteer this SAP is assigned to. NULL = unassigned. |
| `date_id` | BIGINT FK | The playa arrival date this SAP is valid for |
| `created_at` | TIMESTAMP | Auto-set on insert |
| `updated_at` | TIMESTAMP | Auto-set on update |

**File storage:** Configurable directory via env var `SAP_FILES_DIR`
(e.g., `/data/census/saps/`). The `filename` column stores just the hashed filename;
the API constructs the full path at serve-time.

**How SAPs get into this table:** PDFs are provided by the org, split into individual
pages, given hashed filenames, and inserted into this table. That ingestion process is
outside the scope of this document.

**No soft-delete flags:** Unlike most op_* tables, `op_saps` does not have audit/soft-delete
columns. SAP records are either present (assigned or unassigned) or hard-deleted.

### Alter Table: `op_volunteers`

```sql
ALTER TABLE op_volunteers
    ADD COLUMN arrival_date_id BIGINT NULL,
    ADD KEY idx_vol_arrival (arrival_date_id),
    ADD FOREIGN KEY (arrival_date_id) REFERENCES op_dates(date_id);
```

The volunteer picks their expected arrival date on the VIP.

### Alter Table: `op_roles`

```sql
ALTER TABLE op_roles
    ADD COLUMN census_shift_points INT NULL DEFAULT NULL
        COMMENT 'Minimum Census Shift Points required for this role. NULL = no threshold.';
```

### Alter Table: `op_trainings` (optional)

`op_trainings` already has `training_name`, `role_id`, `code`, and `url`. If you want
to show explanatory text on the VIP, add:

```sql
ALTER TABLE op_trainings
    ADD COLUMN description TEXT NULL;
```

Skip this if `training_name` + `url` are sufficient for display.

### Seed Data: New Roles

```sql
INSERT INTO op_roles (role, census_shift_points, display) VALUES
    ('Staff',                NULL, 1),
    ('OtherSAP',             NULL, 1),
    ('CounterCultureCamp',   10,   1),
    ('CensusLabCamp',        16,   1),
    ('BurnerProfileUpdated', NULL, 1),
    ('CensusTicket',         10,   1);
```

| Role                 | CSP | Purpose                                             |
|----------------------|----:|-----------------------------------------------------|
| Staff                |   — | Bypass all SAP requirements                         |
| OtherSAP             |   — | Has SAP from another group; bypass SAP requirements |
| CounterCultureCamp   |  10 | Camping with Census (Counter Culture camp)          |
| CensusLabCamp        |  16 | Census Lab camp                                     |
| BurnerProfileUpdated |   — | Self-service: volunteer confirmed profile is current|
| CensusTicket         |  10 | Receiving a ticket through Census                   |

### Relationship to Existing Schema

```
op_saps.shiftboard_id ──FK──> op_volunteers.shiftboard_id
op_saps.date_id ──FK──> op_dates.date_id
op_volunteers.arrival_date_id ──FK──> op_dates.date_id
op_roles.census_shift_points  (new column, nullable)
```

---

## SAP Eligibility Rules

All eligibility logic reads from `op_*` tables only.

### Bypass Conditions

A volunteer is **exempt** from SAP requirements if **any** of these are true:

| Condition | How to check | What to show |
|-----------|-------------|-------------|
| SAP already issued | `op_saps` row exists with their `shiftboard_id` | Download link + gate message (State 1) |
| Staff | Has `Staff` role in `op_volunteer_roles` | Staff message (State 2) |
| OtherSAP | Has `OtherSAP` role in `op_volunteer_roles` | Other-SAP message (State 3) |
| Post-opening arrival | `arrival_date_id` → datename is after `OpenSun` | "No SAP needed" (State 4) |

Check in the order listed — first match wins.

### Point Requirement

Volunteers must sign up for shifts worth **at least 12 CSP** total.

CSP per position comes from `op_shift_time_position.sap_points` for positions the
volunteer is signed up for (via `op_volunteer_shifts`). Only count positions where
`sap_points >= 1`.

### Day-by-Day Shift Requirement

Based on the volunteer's arrival date (`op_volunteers.arrival_date_id` → `op_dates.datename`),
they need **at least one shift worth ≥1 CSP** on each required day:

| Arrive on | Required shift days |
|-----------|---------------------|
| PreSun    | PreMon, PreTue, PreWed, PreThur, **one of** PreFri / PreSat / OpenSun |
| PreMon    | PreTue, PreWed, PreThur, **one of** PreFri / PreSat / OpenSun |
| PreTue    | PreWed, PreThur, **one of** PreFri / PreSat / OpenSun |
| PreWed    | PreThur, PreFri, **one of** PreSat / OpenSun |
| PreThur   | PreFri, **one of** PreSat / OpenSun |
| PreFri    | **one of** PreSat / OpenSun |
| PreSat    | OpenSun |

PreSun is the earliest arrival date in the dropdown. The `op_dates` entries
EarlyThur, EarlyFri, and EarlyMan are equivalent to PreSun for SAP purposes.

**"One of" logic:** The final group in each row is a single checklist item satisfied if
the volunteer has a qualifying shift on **any** of the listed days.

### Role-Based Point Thresholds

Each role with `census_shift_points IS NOT NULL` adds an **additional requirement**. The
volunteer's total CSP must meet or exceed that role's threshold.

The highest threshold subsumes the lower ones — a volunteer with `CensusLabCamp` (16)
who also needs a base SAP (12) just needs 16 total.

---

## VIP Page Layout

New page at `/volunteers/{shiftboardId}/info`.

<!-- TODO: Confirm this URL fits the existing routing pattern. Alternatives:
/volunteer-info, /vip/{id}. -->

Text in `{curly braces}` is filled at render time.

### Section 1: Welcome Header

Volunteer's playa name and world name. Link to update Burner Profile.

<!-- TODO: Decide exactly which fields to show. Playa name, world name, email, address?
Which of these come from op_volunteers vs other sources? -->

### Section 2: On-Playa Information

Three controls, auto-saving on change:

| Control | Type | Saves to | Hidden when |
|---------|------|----------|-------------|
| Desired/Expected Arrival Date | `<Select>` from `op_dates` | `op_volunteers.arrival_date_id` | SAP already issued |
| SAP from another group? | `<Select>` Yes / No | Toggles `OtherSAP` role | SAP already issued |
| Where will you be camping? | `<TextField>` multiline | `op_volunteers.location` | Never |

### Section 3: SAP Status

First matching state wins:

---

**State 1 — SAP Already Issued** (`op_saps` row exists for this volunteer)

Hide the arrival date and OtherSAP controls. Show:

> Here is your SAP for **{datename}** ({date}). Please download and print it out before
> reaching the gate. Everyone in your car must have one.
>
> [Download SAP PDF]

---

**State 2 — Staff** (has `Staff` role)

> You have been marked as staff. We know you will work your butt off regardless of how
> much you sign up for.

---

**State 3 — OtherSAP** (has `OtherSAP` role)

> You have indicated you are receiving a SAP from another group. You can disregard the
> SAP qualifications below.

---

**State 4 — Post-opening arrival** (arrival datename after OpenSun)

> You have told us you are arriving after opening and do not need a SAP.

---

**State 5 — Normal** (needs SAP)

> **Qualifications for Setup Access Pass (SAP) — arriving {datename} ({date}):**
>
> - [x] Sign up for at least 12 Census Shift Points — *12 / 12 CSP*
> - [x] Shift on PreMon (≥1 CSP) — *Requirement Fulfilled*
> - [ ] Shift on PreTue (≥1 CSP) — *Still needed*
> - [x] Shift on PreWed (≥1 CSP) — *Requirement Fulfilled*
> - [x] Shift on PreThur (≥1 CSP) — *Requirement Fulfilled*
> - [x] Shift on PreFri, PreSat, or OpenSun (≥1 CSP) — *Requirement Fulfilled*

Use green checkmark / red X matching existing CensusScheduler style.

The list of required days is dynamic based on arrival date (see SAP Eligibility Rules).

### Section 4: Role-Based Requirements

For each role the volunteer has where `census_shift_points IS NOT NULL`:

> **{Role Name}**
> Sign up for at least {N} CSP — *{X} / {N} CSP* | *Requirement Fulfilled*

### Section 5: Training Requirements

Derived from volunteer's shift positions: `op_volunteer_shifts` →
`op_shift_time_position` → `op_position_trainings` → `op_trainings`.

For each required training:

> - [x] **{training_name}** — [View materials]({url}) — *Completed*
> - [ ] **{training_name}** — [View materials]({url}) — *Not yet completed*

Training completion is determined by whether the volunteer has the training's `role_id`
in `op_volunteer_roles` (same mechanism as the training confirmation endpoint).

<!-- TODO: How does behavioral standards fit? Options:
(a) Create an op_trainings entry for behavioral standards
(b) Check for a specific role
(c) Other mechanism
-->

### Section 6: Burner Profile Confirmation

Self-service checkbox. Toggles the `BurnerProfileUpdated` role.

> [ ] I have updated my [Burner Profile](https://profiles.burningman.org/participate/my-profile/)

Checked → add role. Already set → show as checked.

### Section 7: Shift List

Table of the volunteer's shifts for the current year:

| Day | Date | Time | Position | CSP |
|-----|------|------|----------|-----|

If total CSP is under 12, show at the bottom:

> **Total CSP: {X}** / 12 required for SAP

---

## Changes to Existing Pages

### Terminology

Rename **"SAP Points"** → **"CSP"** (Census Shift Points) in all display text.

The database column `op_shift_time_position.sap_points` does NOT need to change.

### Shifts List Page

**File:** `client/src/app/shifts/Shifts.tsx`

**New column — CSP:** Show the range of CSP across the shift's positions. Examples:
"2–4" (range) or "3" (all positions equal). Computed from MIN/MAX of
`op_shift_time_position.sap_points` for that `shift_times_id`.

**New filter — "After my arrival date":** Toggle that hides shifts before the
signed-in volunteer's `arrival_date_id`. Default: off (show all).

<!-- TODO: The signed-in volunteer's arrival_date_id needs to be accessible here.
Either include it in the shifts API response, fetch it separately, or add it to
SessionContext. Check what volunteer data is already in session state. -->

### Shift Detail / Volunteers Page

**File:** `client/src/app/shifts/[timeId]/volunteers/ShiftVolunteers.tsx`

In the **Positions table**, add CSP in bold to each row name:

```
Name                         | Filled / Total
Random Sampler — 3 CSP       | 4 / 6
Lab Host — 2 CSP             | 2 / 4
```

Value from `op_shift_time_position.sap_points`.

### Shift Position Form — Training Multi-Select

**File:** `client/src/app/shifts/positions/ShiftPositionsForm.tsx`

New field:

- **Label:** "Required Trainings"
- **Type:** MUI `Autocomplete` with `multiple`
- **Options:** All rows from `op_trainings` (display `training_name`)
- **Saves to:** `op_position_trainings` junction table

**API changes:**
- `GET /api/shifts/positions/defaults` — include `trainings: IResTrainingItem[]`
- `GET /api/shifts/positions/[positionId]` — include `trainingIds: number[]`
- `PATCH /api/shifts/positions/[positionId]` — accept `trainingIds: number[]`,
  sync `op_position_trainings` (delete removed, insert added)

---

## API Endpoints

All routes follow existing CensusScheduler pattern: `pool.query()` with `?` placeholders,
switch on `req.method`, snake_case DB → camelCase response.

### `GET /api/volunteers/[id]/info` — VIP data

Returns all data needed for the VIP page:

```typescript
interface IResVolunteerInfo {
  volunteer: {
    shiftboardId: number;
    playaName: string;
    worldName: string;
    location: string;
  };
  arrivalDate: {
    dateId: number;
    datename: string;
    date: string;           // ISO date
  } | null;
  sapStatus: {
    bypass: boolean;
    bypassReason: "sap_issued" | "staff" | "other_sap" | "post_opening" | null;
    bypassMessage: string | null;
    sapFile: {
      sapId: number;
      filename: string;
      datename: string;
      date: string;
    } | null;
    totalCsp: number;
    requiredCsp: number;    // always 12
    cspFulfilled: boolean;
    requiredDays: {
      datenames: string[];  // e.g., ["PreFri","PreSat","OpenSun"]
      label: string;        // e.g., "PreFri, PreSat, or OpenSun"
      fulfilled: boolean;
    }[];
  };
  roleThresholds: {
    role: string;
    requiredCsp: number;
    fulfilled: boolean;
  }[];
  trainings: {
    trainingId: number;
    trainingName: string;
    url: string;
    description: string | null;
    completed: boolean;     // has the training's role_id in op_volunteer_roles
  }[];
  roles: string[];          // all role names this volunteer has
  dates: {                  // for arrival date dropdown
    dateId: number;
    datename: string;
    date: string;
  }[];
  shifts: {
    datename: string;
    date: string;
    time: string;
    position: string;
    csp: number;
  }[];
}
```

**Query flow:**

1. Fetch volunteer: `SELECT * FROM op_volunteers WHERE shiftboard_id = ? AND delete_volunteer = false`
2. Fetch arrival date: `SELECT * FROM op_dates WHERE date_id = ?` (if `arrival_date_id` set)
3. Check for SAP file:
   ```sql
   SELECT s.sap_id, s.filename, d.datename, d.date
   FROM op_saps s
   JOIN op_dates d ON s.date_id = d.date_id
   WHERE s.shiftboard_id = ?
   ORDER BY s.created_at DESC LIMIT 1
   ```
4. Fetch volunteer roles:
   ```sql
   SELECT r.role, r.census_shift_points
   FROM op_volunteer_roles vr
   JOIN op_roles r ON vr.role_id = r.role_id
   WHERE vr.shiftboard_id = ? AND vr.remove_role = false
   ```
5. Calculate total CSP:
   ```sql
   SELECT COALESCE(SUM(stp.sap_points), 0) AS total_csp
   FROM op_volunteer_shifts vs
   JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
   WHERE vs.shiftboard_id = ?
     AND vs.remove_shift = false
     AND stp.remove_time_position = false
   ```
6. CSP per day:
   ```sql
   SELECT d.datename, COALESCE(SUM(stp.sap_points), 0) AS day_csp
   FROM op_volunteer_shifts vs
   JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
   JOIN op_shift_times st ON stp.shift_times_id = st.shift_times_id
   JOIN op_dates d ON st.start_date_id = d.date_id
   WHERE vs.shiftboard_id = ?
     AND vs.remove_shift = false
     AND stp.remove_time_position = false
     AND st.remove_shift_time = false
   GROUP BY d.datename
   ```
7. Required trainings:
   ```sql
   SELECT DISTINCT t.training_id, t.training_name, t.url, t.description
   FROM op_volunteer_shifts vs
   JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
   JOIN op_position_trainings pt ON stp.position_type_id = pt.position_type_id
   JOIN op_trainings t ON pt.training_id = t.training_id
   WHERE vs.shiftboard_id = ?
     AND vs.remove_shift = false
     AND stp.remove_time_position = false
     AND pt.delete_position_training = false
     AND t.delete_training = false
   ```
8. Volunteer shifts:
   ```sql
   SELECT d.datename, d.date, st.start_time, st.end_time,
          pt.position, stp.sap_points
   FROM op_volunteer_shifts vs
   JOIN op_shift_time_position stp ON vs.time_position_id = stp.time_position_id
   JOIN op_shift_times st ON stp.shift_times_id = st.shift_times_id
   JOIN op_dates d ON st.start_date_id = d.date_id
   JOIN op_position_type pt ON stp.position_type_id = pt.position_type_id
   WHERE vs.shiftboard_id = ?
     AND vs.remove_shift = false
     AND stp.remove_time_position = false
     AND st.remove_shift_time = false
     AND pt.delete_position = false
   ORDER BY d.date, st.start_time
   ```
9. All dates (for dropdown):
   ```sql
   SELECT date_id, datename, date FROM op_dates ORDER BY date
   ```
10. Compute SAP status from the results of steps 2–6 (see SAP Eligibility Rules).

### `PATCH /api/volunteers/[id]/info` — Update arrival date and/or location

```typescript
// Request body (all fields optional)
interface IReqVolunteerInfoUpdate {
  arrivalDateId?: number | null;
  location?: string;
}
```

**arrivalDateId:**
```sql
UPDATE op_volunteers
SET arrival_date_id = ?, update_volunteer = true
WHERE shiftboard_id = ?
```

**location:**
```sql
UPDATE op_volunteers
SET location = ?, update_volunteer = true
WHERE shiftboard_id = ?
```

Returns the refreshed `sapStatus` block (re-run steps 2–6 from the GET endpoint) so the
UI can update the checklist without a full page reload.

### `POST /api/volunteers/[id]/info/other-sap` — Toggle OtherSAP role

```typescript
// Request body
interface IReqToggleOtherSap {
  hasOtherSap: boolean;
}
```

`true` → add `OtherSAP` role (SELECT-then-INSERT/UPDATE pattern, same as
`/api/confirm/[code]` POST). `false` → soft-remove (`remove_role = true`).

Returns refreshed `sapStatus`.

### `POST /api/volunteers/[id]/info/profile-updated` — Toggle BurnerProfileUpdated

```typescript
// Request body
interface IReqToggleProfileUpdated {
  updated: boolean;
}
```

Same SELECT-then-INSERT/UPDATE pattern.

### `GET /api/volunteers/[id]/sap/[sapId]` — Download SAP PDF

Stream the file from `SAP_FILES_DIR + filename`. Verify `op_saps.shiftboard_id` matches
the path parameter `id` (or requester is admin).

Return with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="sap-{datename}.pdf"
```

---

## Gotchas & Implementation Notes

1. **Do NOT use `generateId()`** for `sap_id`. Use `AUTO_INCREMENT` and omit the ID from
   INSERT statements.

2. **Soft-delete filters**: All queries against op_* tables must respect soft-delete flags.
   Missing any of these will return deleted/removed data.
   - `op_volunteer_shifts`: `remove_shift = false`
   - `op_volunteer_roles`: `remove_role = false`
   - `op_shift_time_position`: `remove_time_position = false`
   - `op_shift_times`: `remove_shift_time = false`
   - `op_position_type`: `delete_position = false`
   - `op_position_trainings`: `delete_position_training = false`
   - `op_trainings`: `delete_training = false`
   - `op_volunteers`: `delete_volunteer = false`

3. **Role toggle pattern**: Use SELECT-then-branch (check if row exists, then INSERT or
   UPDATE). This matches the existing pattern in `/pages/api/roles/[roleId]/volunteers/`.
   Do NOT use `ON DUPLICATE KEY UPDATE`.

4. **Auth is client-side only**: `shiftboardId` comes from `SessionContext` on the client.
   The `[id]` path parameter is the volunteer ID. Verify the signed-in user matches `[id]`
   (or is admin) to prevent a volunteer from viewing/modifying another volunteer's VIP.

5. **Day-by-day "one of" group**: The last requirement in each arrival-date row is a group
   (e.g., `["PreFri", "PreSat", "OpenSun"]`). The API returns this as
   `{ datenames: [...], label: "PreFri, PreSat, or OpenSun", fulfilled: boolean }`.
   Fulfilled = any datename in the group has ≥1 CSP.

6. **CSP column on shifts list**: The shifts API already returns position data. The CSP
   range can be computed server-side (MIN/MAX sap_points per shift_times_id) or
   client-side from existing data. Pick whichever is simpler.

7. **Arrival date dropdown options**: Query all dates from `op_dates` sorted by `date`.
   The UI should only offer dates from PreSun through OpenSun (filter out dates outside
   this range, or flag which dates are valid arrival options).

8. **Route file placement**: API routes go in `client/src/pages/api/` (Pages Router).
   Frontend page goes in `client/src/app/` (App Router). This matches the existing split.

9. **Schema location**: Add the `CREATE TABLE op_saps` statement and `ALTER TABLE`
   statements to `database/scheduler_schema.sql`. The `op_saps` table must come after
   `op_volunteers` and `op_dates` due to FK dependencies.

10. **On-playa SQL dumps**: `update_server.sh` dumps all `op_*` tables. Since `op_saps`
    follows the prefix convention, it will be included automatically.

11. **Audit flags on UPDATE**: When updating `op_volunteers` columns, also set
    `update_volunteer = true`. This matches the convention for other op_* tables where
    `update_*` flags indicate the record was modified.

12. **Navigation to VIP**: Add a link to the VIP from the volunteer's account page
    (e.g., `/volunteers/{id}/account`). Also consider adding it to the main nav for
    authenticated volunteers.

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `client/src/pages/api/volunteers/[id]/info/index.ts` | VIP data GET + PATCH |
| Create | `client/src/pages/api/volunteers/[id]/info/other-sap/index.ts` | Toggle OtherSAP role |
| Create | `client/src/pages/api/volunteers/[id]/info/profile-updated/index.ts` | Toggle BurnerProfileUpdated |
| Create | `client/src/pages/api/volunteers/[id]/sap/[sapId]/index.ts` | SAP PDF download |
| Create | `client/src/app/volunteers/[id]/info/page.tsx` | VIP page entry |
| Create | `client/src/app/volunteers/[id]/info/VolunteerInfo.tsx` | VIP main component |
| Create | `client/src/components/types/volunteer-info.ts` | TypeScript interfaces |
| Modify | `client/src/app/shifts/Shifts.tsx` | Add CSP column + arrival date filter |
| Modify | `client/src/app/shifts/[timeId]/volunteers/ShiftVolunteers.tsx` | Bold CSP in positions table |
| Modify | `client/src/app/shifts/positions/ShiftPositionsForm.tsx` | Training multi-select |
| Modify | `client/src/pages/api/shifts/positions/defaults/index.ts` | Include trainings list |
| Modify | `client/src/pages/api/shifts/positions/[positionId]/index.ts` | Include/save training associations |
| Modify | `database/scheduler_schema.sql` | Add `op_saps`, alter `op_volunteers`, alter `op_roles` |

---

## Implementation Order

### Phase 1: Schema & Seed Data
1. Add `census_shift_points` column to `op_roles`
2. Add `arrival_date_id` column to `op_volunteers`
3. Create `op_saps` table
4. Insert 6 new roles
5. (Optional) Add `description` column to `op_trainings`
6. Update `database/scheduler_schema.sql`

### Phase 2: API Routes
1. `GET /api/volunteers/[id]/info` — VIP data
2. `PATCH /api/volunteers/[id]/info` — update arrival date + location
3. `POST /api/volunteers/[id]/info/other-sap` — toggle OtherSAP
4. `POST /api/volunteers/[id]/info/profile-updated` — toggle BurnerProfileUpdated
5. `GET /api/volunteers/[id]/sap/[sapId]` — SAP file download
6. Modify shifts/positions API for training associations

### Phase 3: VIP Page
1. Create page component and route
2. Welcome header
3. On-playa info (arrival date + OtherSAP + location)
4. SAP status display (all 5 states)
5. SAP eligibility checklist (points + day-by-day)
6. Role-based CSP threshold display
7. Training requirements display
8. Burner Profile confirmation checkbox
9. Shift list table with CSP column

### Phase 4: Existing Page Updates
1. Rename "SAP Points" → "CSP" throughout
2. CSP column on shifts list (`Shifts.tsx`)
3. "After my arrival date" filter on shifts list
4. Bold CSP in positions table (`ShiftVolunteers.tsx`)
5. Training multi-select on position form (`ShiftPositionsForm.tsx`)

---

## Testing Checklist

- [ ] VIP page loads for authenticated volunteer
- [ ] VIP page blocks access for wrong volunteer (can't view other's VIP)
- [ ] Arrival date dropdown populated from `op_dates`
- [ ] Changing arrival date updates SAP checklist without full reload
- [ ] OtherSAP toggle adds/removes role correctly
- [ ] OtherSAP toggle hides/shows SAP checklist
- [ ] Staff volunteer sees staff bypass message
- [ ] SAP-issued volunteer sees download link, arrival/OtherSAP hidden
- [ ] SAP PDF downloads correctly
- [ ] Post-opening arrival shows "no SAP needed"
- [ ] Day-by-day checklist matches the rules for each arrival date
- [ ] "One of" group shows fulfilled if any day in group is covered
- [ ] CSP total correctly sums from volunteer's shift positions
- [ ] Role-based thresholds display for CounterCultureCamp, CensusLabCamp, CensusTicket
- [ ] Training requirements derived from volunteer's shift positions
- [ ] BurnerProfileUpdated checkbox toggles role
- [ ] Shift list shows correct CSP per shift
- [ ] CSP column appears on shifts list page
- [ ] CSP range shows min–max correctly
- [ ] "After my arrival date" filter hides earlier shifts
- [ ] Bold CSP shows in positions table on shift detail
- [ ] Training multi-select on position form saves to `op_position_trainings`
- [ ] Soft-deleted roles, positions, trainings are excluded from all queries

---

## Resolved Questions

1. **EarlyThur / EarlyFri / EarlyMan** (`op_dates` entries) — Equivalent to PreSun
   for SAP purposes. PreSun is the earliest arrival date in the dropdown.
2. **SAP file format** — PDFs from the org, split, hashed. Ingestion out of scope.
3. **Camping location** — Already `op_volunteers.location`. Use directly.
4. **Scope** — Only `op_*` tables.
5. **App** — VIP is built in CensusScheduler (Next.js).
