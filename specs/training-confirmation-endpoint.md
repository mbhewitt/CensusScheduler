# Training Confirmation Endpoint Spec

## Overview

A new endpoint `/api/confirm/[code]` allows volunteers to confirm training completion via a unique link. The flow:
1. Volunteer visits `/confirm/{code}` in the app (must be signed in)
2. Page shows training details and a "Confirm" button
3. On confirm, the training's completion role is assigned to the volunteer
4. Page displays a thank-you message and lists available shifts requiring that training

---

## Database Changes

### New Table: `op_trainings`

Defines available trainings and their confirmation codes.

```sql
DROP TABLE IF EXISTS `op_trainings`;
CREATE TABLE `op_trainings` (
  `training_id` bigint NOT NULL AUTO_INCREMENT,
  `training_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  `code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `create_training` tinyint(1) DEFAULT '0',
  `update_training` tinyint(1) DEFAULT '0',
  `delete_training` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`training_id`),
  UNIQUE KEY `training_name` (`training_name`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_training_role` (`role_id`),
  CONSTRAINT `fk_training_role` FOREIGN KEY (`role_id`) REFERENCES `op_roles` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

| Column | Type | Purpose |
|--------|------|---------|
| `training_id` | BIGINT AUTO_INCREMENT | PK (let MySQL assign -- do not use `generateId()`) |
| `training_name` | VARCHAR(128) UNIQUE | Display name (e.g., "Gate Training") |
| `role_id` | BIGINT FK | The role granted on completion (FK to `op_roles`) |
| `code` | VARCHAR(64) UNIQUE | URL-safe confirmation code (see Code Format below) |
| `url` | VARCHAR(512) | Link to the training course material |
| `create_training` | tinyint(1) | Audit: record was created |
| `update_training` | tinyint(1) | Audit: record was modified |
| `delete_training` | tinyint(1) | Audit: soft delete flag |

### New Table: `op_position_trainings`

Links positions to required trainings. A position may require multiple trainings.

```sql
DROP TABLE IF EXISTS `op_position_trainings`;
CREATE TABLE `op_position_trainings` (
  `position_training_id` bigint NOT NULL AUTO_INCREMENT,
  `position_type_id` bigint DEFAULT NULL,
  `training_id` bigint DEFAULT NULL,
  `create_position_training` tinyint(1) DEFAULT '0',
  `update_position_training` tinyint(1) DEFAULT '0',
  `delete_position_training` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`position_training_id`),
  UNIQUE KEY `uk_position_training` (`position_type_id`,`training_id`),
  KEY `fk_pt_training` (`training_id`),
  CONSTRAINT `fk_pt_position` FOREIGN KEY (`position_type_id`) REFERENCES `op_position_type` (`position_type_id`),
  CONSTRAINT `fk_pt_training` FOREIGN KEY (`training_id`) REFERENCES `op_trainings` (`training_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
```

| Column | Type | Purpose |
|--------|------|---------|
| `position_training_id` | BIGINT AUTO_INCREMENT | PK (let MySQL assign) |
| `position_type_id` | BIGINT FK | Which position requires this training |
| `training_id` | BIGINT FK | Which training is required |
| `create/update/delete_position_training` | tinyint(1) | Audit flags |

### Code Format

The `code` column must be URL-safe and not guessable. Use format: `{type}-{year}-{16-char-random}`.

Example: `gate-2026-a1b2c3d4e5f6g7h8`

Generate the random portion with: `crypto.randomBytes(12).toString('base64url').slice(0, 16)`

This gives ~96 bits of entropy -- brute-force infeasible even without rate limiting.

### Relationship to Existing Schema

```
op_trainings.role_id ──FK──> op_roles.role_id
op_position_trainings.position_type_id ──FK──> op_position_type.position_type_id
op_position_trainings.training_id ──FK──> op_trainings.training_id
```

### Interaction with `op_position_type.prerequisite_id`

The existing `op_position_type.prerequisite_id` (FK to `op_shift_category`) represents "experience in a shift category" as a prerequisite. The new `op_position_trainings` table represents "formal training completion" prerequisites.

**These are independent systems.** A position can have:
- A `prerequisite_id` only (experience-based)
- `op_position_trainings` entries only (training-based)
- Both (volunteer must satisfy all)
- Neither

The shift volunteer add dialog (`ShiftVolunteersDialogAdd.tsx`) currently checks `prerequisiteId` and `roleRequiredId`. When `op_position_trainings` is implemented, this dialog should also check whether the volunteer holds the training role(s). This is a **follow-up change** -- the confirmation endpoint works independently of the dialog filtering.

---

## API Endpoints

### `GET /api/confirm/[code]` -- Read-only lookup

Returns training info, whether the volunteer has already confirmed, and available shifts. **No side effects.**

**Query parameter**: `shiftboardId` (required) -- the signed-in volunteer's ID, passed from client-side session state.

**Path parameter**: `code` -- the unique confirmation code from `op_trainings`.

**Flow**:

1. Parse `shiftboardId` from query: `const { shiftboardId } = req.query`
2. Look up the training by code:
   ```sql
   SELECT t.training_id, t.training_name, t.role_id, t.url, r.role AS role_name
   FROM op_trainings AS t
   JOIN op_roles AS r ON r.role_id = t.role_id
   WHERE t.code = ? AND t.delete_training = false
   ```
3. If not found, return 404: `{ statusCode: 404, message: "Not found" }`
4. Get the volunteer's playa name:
   ```sql
   SELECT playa_name FROM op_volunteers
   WHERE shiftboard_id = ? AND delete_volunteer = false
   ```
5. Check if the role is already assigned:
   ```sql
   SELECT role_id FROM op_volunteer_roles
   WHERE shiftboard_id = ? AND role_id = ? AND remove_role = false
   ```
6. Query positions that require this training, and their shifts:
   ```sql
   SELECT DISTINCT
     sn.shift_name, sn.shift_name_id,
     sc.department,
     pt.position, pt.position_type_id,
     st.shift_instance, st.start_time, st.end_time, st.shift_times_id,
     d.datename
   FROM op_position_trainings AS ptr
   JOIN op_position_type AS pt ON ptr.position_type_id = pt.position_type_id
   JOIN op_shift_time_position AS stp ON pt.position_type_id = stp.position_type_id
   JOIN op_shift_times AS st ON stp.shift_times_id = st.shift_times_id
   JOIN op_shift_name AS sn ON st.shift_name_id = sn.shift_name_id
   JOIN op_shift_category AS sc ON sn.shift_category_id = sc.shift_category_id
   JOIN op_dates AS d ON st.start_date_id = d.date_id
   WHERE ptr.training_id = ?
     AND ptr.delete_position_training = false
     AND pt.delete_position = false
     AND stp.remove_time_position = false
     AND st.remove_shift_time = false
     AND sn.delete_shift_name = false
     AND sc.delete_category = false
   ORDER BY d.date, st.start_time
   ```
7. Return response (map DB snake_case to camelCase as per codebase convention):

```typescript
interface IResTrainingConfirmation {
  training: {
    name: string;       // training_name
    roleName: string;   // role (from op_roles join)
    url: string;        // link to training course material
  };
  volunteer: {
    playaName: string;  // playa_name
  };
  alreadyConfirmed: boolean;
  availableShifts: IResTrainingShiftItem[];
}

interface IResTrainingShiftItem {
  dateName: string;
  department: string;
  endTime: string;
  position: string;
  positionId: number;
  shiftName: string;
  shiftTimesId: number;
  startTime: string;
}
```

**Error responses**:
- `404` - Invalid or deleted confirmation code

### `POST /api/confirm/[code]` -- Assign role

Performs the actual role assignment. Called once by the frontend on user action.

**Request body**:
```typescript
interface IReqTrainingConfirm {
  shiftboardId: number;
}
```

**Flow**:

1. Parse body: `const { shiftboardId }: IReqTrainingConfirm = JSON.parse(req.body)`
2. Look up training by code (same query as GET step 2). Return 404 if not found.
3. Check if role already assigned (SELECT first, then branch -- matches codebase pattern):
   ```sql
   SELECT role_id FROM op_volunteer_roles
   WHERE role_id = ? AND shiftboard_id = ?
   ```
4. If row exists (even if soft-deleted), UPDATE:
   ```sql
   UPDATE op_volunteer_roles
   SET add_role = true, remove_role = false
   WHERE role_id = ? AND shiftboard_id = ?
   ```
5. If no row exists, INSERT:
   ```sql
   INSERT INTO op_volunteer_roles (shiftboard_id, role_id, add_role, remove_role)
   VALUES (?, ?, true, false)
   ```
6. Return: `{ statusCode: 201, message: "Created" }`
   Or if already confirmed: `{ statusCode: 200, message: "OK" }`

---

## Frontend

### New Page: `/confirm/[code]/page.tsx`

**Location**: `client/src/app/confirm/[code]/page.tsx`

**Component**: `TrainingConfirmation`

**Auth**: Check `sessionState.settings.isAuthenticated` from session context. If not signed in:
1. Store the current URL (`/confirm/{code}`) in `sessionStorage` under a key like `redirectAfterSignIn`
2. Redirect to `/sign-in`

This requires a small change to the sign-in success handler (in `SignIn.tsx`): after successful sign-in, check `sessionStorage.getItem("redirectAfterSignIn")`. If present, navigate there and clear the key. Otherwise navigate to the default landing page.

This redirect mechanism is auth-method-agnostic -- it works the same whether sign-in uses passcode or OAuth.

**Data fetching**:

1. Use `useSWR` for the GET (read-only lookup):
   ```typescript
   const { data, error } = useSWR(
     `/api/confirm/${code}?shiftboardId=${sessionState.user.shiftboardId}`,
     fetcherGet
   );
   ```

2. Use `useSWRMutation` with `fetcherTrigger` for the POST (role assignment):
   ```typescript
   const { trigger } = useSWRMutation(`/api/confirm/${code}`, fetcherTrigger);

   const handleConfirm = async () => {
     await trigger({
       method: "POST",
       body: { shiftboardId: sessionState.user.shiftboardId },
     });
     // Update client-side session state with new role
     sessionDispatch({
       type: SESSION_ROLE_ITEM_ADD,
       payload: { id: data.training.roleId, name: data.training.roleName },
     });
     // Revalidate the GET to show updated state
     mutate(`/api/confirm/${code}?shiftboardId=${sessionState.user.shiftboardId}`);
   };
   ```

**Display states**:

1. **Loading**: Show `<Loading />` component
2. **Error / 404**: Show `<ErrorPage />`
3. **Not yet confirmed** (`alreadyConfirmed: false`):
   ```
   {trainingName}

   Hi {playaName}! Confirm your completion of {trainingName} to unlock
   shifts that require this training.

   [Confirm] button

   Available shifts requiring {trainingName}:
   - [shift list with links to /shifts/{shiftTimesId}/volunteers]
   ```
4. **After confirmation / already confirmed** (`alreadyConfirmed: true`):
   ```
   Thank you, {playaName}, for confirming completion of {trainingName}!

   Your {roleName} role has been added to your account.

   Sign up for shifts that need this training:
   - [shift list with links to /shifts/{shiftTimesId}/volunteers]
   ```
5. **No available shifts**: Replace shift list with:
   ```
   There are no open shifts requiring {trainingName} at this time.
   ```

**UI Components** (follow existing patterns):
- `<Hero text="Training Confirmation" />`
- `<Container component="main">` wrapper
- Shift list as MUI `<List>` with clickable items linking to `/shifts/{shiftTimesId}/volunteers`
- Use `useSnackbar()` from notistack for success/error feedback after POST
- Use `<Button>` from MUI for the confirm action

---

## Admin Management (Future / Optional)

For managing trainings via the admin UI, add CRUD endpoints following the same pattern as `/api/roles`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trainings` | GET | List all trainings |
| `/api/trainings` | POST | Create training (let MySQL auto-generate ID) |
| `/api/trainings/[trainingId]` | PATCH | Update training |
| `/api/trainings/[trainingId]` | DELETE | Soft delete (`delete_training = true`) |
| `/api/trainings/[trainingId]/positions` | GET | List positions linked to training |
| `/api/trainings/[trainingId]/positions` | POST | Link position to training |
| `/api/trainings/[trainingId]/positions/[positionTrainingId]` | DELETE | Unlink position |

---

## Gotchas & Implementation Notes

1. **Do NOT use `generateId()`** for `training_id` or `position_training_id`. The existing `generateId()` has an async race condition (returns before the duplicate check completes). These tables use `AUTO_INCREMENT` -- omit the ID from INSERT statements and let MySQL assign it.

2. **Code generation**: For the `code` column on `op_trainings`, generate codes server-side when creating a training via the admin endpoint. Use `crypto.randomBytes(12).toString('base64url').slice(0, 16)` for the random portion. Format: `{type}-{year}-{random16}`.

3. **Role assignment pattern**: Use the SELECT-then-branch pattern (check if row exists, then INSERT or UPDATE). This matches the existing pattern in `/pages/api/roles/[roleId]/volunteers/index.ts`. Do NOT use `ON DUPLICATE KEY UPDATE` -- no endpoint in the codebase uses it.

4. **Soft deletes**: Never hard-delete. Use `delete_*` flags and always filter with `WHERE delete_* = false` in queries.

5. **Route file placement**: API route: `client/src/pages/api/confirm/[code]/index.ts` (pages router). Frontend page: `client/src/app/confirm/[code]/page.tsx` (app router). All API routes use pages router; all UI pages use app router.

6. **Auth is client-side only**: There is no server-side auth middleware. The `shiftboardId` is passed as a query param (GET) or body field (POST) from client-side session state. The `AuthGate` component prevents unauthenticated users from reaching the page. This matches every other endpoint in the codebase.

7. **Session state update**: After assigning the role via POST, dispatch `SESSION_ROLE_ITEM_ADD` to the session reducer to update the client-side role list. Do NOT use `mutate("/api/volunteers/...")` -- the role list lives in React context, not SWR cache.

8. **`prerequisite_id` coexistence**: The existing `op_position_type.prerequisite_id` (FK to `op_shift_category`) is a separate prerequisite system. Both coexist. The `op_position_trainings` table is for formal training completion; `prerequisite_id` is for shift category experience. The volunteer add dialog will need a follow-up update to check training roles too.

9. **`op_roles.display`**: Set `display = 0` for training completion roles so they don't clutter the main roles admin list. They'll still appear in the volunteer's role list.

10. **Collation**: `utf8mb4_bin` means `code` lookups are case-sensitive. Codes should be lowercase for consistency.

11. **Schema location**: Add the new `CREATE TABLE` statements to `database/scheduler_schema.sql`. Use `DROP TABLE IF EXISTS` before each (matching existing convention). The tables must be created after `op_roles` and `op_position_type` due to FK dependencies.

12. **On-playa SQL dumps**: The `update_server.sh` script dumps all `op_*` tables. Since the new tables follow the `op_` prefix, they'll be included automatically.

13. **Soft-delete filters in shift query**: The shifts query MUST filter on ALL soft-delete columns: `delete_position_training`, `delete_position`, `remove_time_position`, `remove_shift_time`, `delete_shift_name`, `delete_category`. Missing any of these will return deleted/removed data.

---

## Seed Data

Role IDs start at 2000001 (above current max of 1001321).

Codes use 5 unambiguous characters (no 0/O, 1/I/l): `ABCDEFGHJKMNPQRSTUVWXYZ23456789`

```sql
-- ============================================================
-- Training completion roles
-- ============================================================
INSERT INTO op_roles (`role_id`, `role`, `display`, `create_role`, `delete_role`, `role_src`) VALUES
  (2000001, 'TrainingCensusBasicsComplete',      0, 1, 0, 'tablet'),
  (2000002, 'TrainingRandomSamplingComplete',     0, 1, 0, 'tablet'),
  (2000003, 'TrainingOutReachComplete',           0, 1, 0, 'tablet'),
  (2000004, 'TrainingDataEntryWizComplete',       0, 1, 0, 'tablet'),
  (2000005, 'TrainingDataBeastDriverComplete',    0, 1, 0, 'tablet');

-- ============================================================
-- Training definitions
-- ============================================================
INSERT INTO op_trainings (`training_name`, `role_id`, `code`, `url`, `create_training`) VALUES
  ('Census Basics', 2000001, 'XQDDG',
   'https://hive.burningman.org/posts/census-course-basics-start-here-course-overview-84578159', 1),
  ('Random Sampling', 2000002, 'AH73H',
   'https://hive.burningman.org/posts/census-course-random-sampling-start-here-random-sampling-course-overview', 1),
  ('OutReach', 2000003, 'XQ9VD',
   'https://hive.burningman.org/posts/census-course-outreach-course-overview-start-here-84578181', 1),
  ('DataEntry Wiz', 2000004, 'TMBSW',
   'https://drive.google.com/file/d/1rhB75gEhYQ7gctzHZEHG7xLrRWiejyth/view?usp=drivesdk', 1),
  ('DataBeast Driver', 2000005, 'PZBWG',
   'https://hive.burningman.org/posts/census-course-databeast-drive-start-here-databeast-driver-course-overview', 1);

-- ============================================================
-- Position-training links
-- training_id references: 1=Census Basics, 2=Random Sampling, 3=OutReach, 4=DataEntry Wiz, 5=DataBeast Driver
-- ============================================================

-- Census Basics (all positions)
INSERT INTO op_position_trainings (`position_type_id`, `training_id`, `create_position_training`) VALUES
  (1, 1, 1),       -- Airport Sampler
  (9, 1, 1),       -- Airport Sampling Lead
  (18, 1, 1),      -- Art Tour Lead
  (28, 1, 1),      -- Artist
  (17, 1, 1),      -- Census Art Tour
  (15, 1, 1),      -- Census Lab Host
  (36, 1, 1),      -- Census PopUp Lab Host
  (27, 1, 1),      -- Data Disseminator
  (19, 1, 1),      -- Data Entry Shift Lead
  (20, 1, 1),      -- Data Entry Wiz
  (40, 1, 1),      -- DataBash Presenter
  (10, 1, 1),      -- DataBeast Driver
  (3, 1, 1),       -- Gate Sampler
  (8, 1, 1),       -- Gate Sampling Lead
  (30, 1, 1),      -- Infoboard creator
  (16, 1, 1),      -- Lab Host Lead
  (13, 1, 1),      -- Lab Host Lead Trainee
  (14, 1, 1),      -- Lab Host Lead Trainer
  (35, 1, 1),      -- Lab Host Trainer
  (34, 1, 1),      -- Lab Host Training
  (41, 1, 1),      -- Party Host
  (21, 1, 1),      -- Party Support
  (33, 1, 1),      -- Random Sampling Trainer
  (32, 1, 1),      -- Random Sampling Training
  (11, 1, 1),      -- Sampling Lead Trainee
  (12, 1, 1),      -- Sampling Lead Trainer
  (23, 1, 1),      -- Setup Crew
  (26, 1, 1),      -- Setup Lead
  (29, 1, 1),      -- Statistician
  (24, 1, 1),      -- Strike
  (25, 1, 1),      -- Strike Lead
  (31, 1, 1),      -- Tech Support
  (2, 1, 1),       -- Traffic Tamer
  (955994, 1, 1),  -- Trainee
  (685401, 1, 1);  -- Welcome Party

-- Random Sampling
INSERT INTO op_position_trainings (`position_type_id`, `training_id`, `create_position_training`) VALUES
  (1, 2, 1),       -- Airport Sampler
  (9, 2, 1),       -- Airport Sampling Lead
  (3, 2, 1),       -- Gate Sampler
  (8, 2, 1),       -- Gate Sampling Lead
  (33, 2, 1),      -- Random Sampling Trainer
  (32, 2, 1),      -- Random Sampling Training
  (11, 2, 1),      -- Sampling Lead Trainee
  (12, 2, 1),      -- Sampling Lead Trainer
  (2, 2, 1);       -- Traffic Tamer

-- OutReach
INSERT INTO op_position_trainings (`position_type_id`, `training_id`, `create_position_training`) VALUES
  (15, 3, 1),      -- Census Lab Host
  (36, 3, 1),      -- Census PopUp Lab Host
  (27, 3, 1),      -- Data Disseminator
  (16, 3, 1),      -- Lab Host Lead
  (13, 3, 1),      -- Lab Host Lead Trainee
  (14, 3, 1),      -- Lab Host Lead Trainer
  (35, 3, 1),      -- Lab Host Trainer
  (34, 3, 1);      -- Lab Host Training

-- DataEntry Wiz
INSERT INTO op_position_trainings (`position_type_id`, `training_id`, `create_position_training`) VALUES
  (19, 4, 1),      -- Data Entry Shift Lead
  (20, 4, 1);      -- Data Entry Wiz

-- DataBeast Driver
INSERT INTO op_position_trainings (`position_type_id`, `training_id`, `create_position_training`) VALUES
  (10, 5, 1);      -- DataBeast Driver
```

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `client/src/pages/api/confirm/[code]/index.ts` | API endpoint (GET + POST) |
| Create | `client/src/app/confirm/[code]/page.tsx` | Frontend page entry |
| Create | `client/src/app/confirm/[code]/TrainingConfirmation.tsx` | Page component |
| Create | `client/src/components/types/confirm.ts` | TypeScript interfaces |
| Modify | `database/scheduler_schema.sql` | Add `op_trainings` and `op_position_trainings` tables |
| Modify | `client/src/app/sign-in/SignIn.tsx` | Add sessionStorage redirect-after-sign-in check |

---

## Testing Checklist

- [ ] GET with valid code: returns training info + shift list
- [ ] GET with invalid/deleted code: returns 404
- [ ] POST with valid code: assigns role, returns 201
- [ ] POST with already-confirmed code: re-enables role (idempotent), returns 200
- [ ] GET after POST: `alreadyConfirmed` is true
- [ ] Visiting page while not signed in: redirects to sign-in, then back to confirm page after sign-in
- [ ] Shifts query excludes soft-deleted positions, shift times, categories
- [ ] Shifts query excludes soft-deleted position_trainings
- [ ] New tables created correctly in Docker init (scheduler_schema.sql)
- [ ] New tables included in on-playa SQL dumps (op_ prefix auto-includes)
- [ ] Session state updated after confirmation (role appears in UI)
- [ ] Multiple volunteers can confirm the same training code
- [ ] Code is case-sensitive (lowercase enforced)
