-- #804 step 2: configurable permissions. Tables + day-one seed only; nothing
-- reads them until routes move onto can() (step 3). The seed reproduces today's
-- server-side checks exactly: role 1 = SuperAdmin (to be renamed App Admin),
-- role 2 = Admin. Permission names live in client/src/lib/permissions.logic.ts.

-- Named time windows. Bounds are an anchor + offset in minutes. A NULL anchor
-- means open-ended. 'shift_*' anchors are relative to the shift being acted on.
-- 'date' anchors use op_dates (midnight, playa time).
CREATE TABLE op_time_window (
  window_key VARCHAR(32) NOT NULL,
  start_anchor ENUM('shift_start','shift_end','date') NULL,
  start_date_id BIGINT NULL,
  start_offset_min INT NOT NULL DEFAULT 0,
  end_anchor ENUM('shift_start','shift_end','date') NULL,
  end_date_id BIGINT NULL,
  end_offset_min INT NOT NULL DEFAULT 0,
  PRIMARY KEY (window_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Same values as the constants in client/src/constants.ts and the 24h
-- self-drop grace in components/api/shiftVolunteers.ts.
INSERT INTO op_time_window
  (window_key, start_anchor, start_offset_min, end_anchor, end_offset_min) VALUES
  ('shift_future',   NULL,          0,    'shift_start', -60),
  ('shift_during',   'shift_start', -60,  'shift_end',   120),
  ('shift_past',     'shift_end',   120,  NULL,          0),
  ('walkup_checkin', 'shift_start', -30,  'shift_start', 30),
  ('self_drop',      NULL,          0,    'shift_end',   1440);

-- One row = one grant. A user may do `permission` if ANY row matches.
--   grantee:      anyone (signed out too) · signed_in · role (op_roles).
--                 Never a sign-up: a position may hand out a role (separate
--                 issue), and the role carries the privileges (Chipper).
--   relationship: everyone · self · shift (actor is on the shift) ·
--                 department (subject/shift is in `department`, an
--                 op_shift_category.department value; set it from the role,
--                 never from sign-ups, so access survives a year off — Chipper)
CREATE TABLE op_permission_grant (
  grant_id BIGINT NOT NULL AUTO_INCREMENT,
  grantee_type ENUM('anyone','signed_in','role') NOT NULL,
  grantee_id BIGINT NULL,
  permission VARCHAR(64) NOT NULL,
  relationship ENUM('everyone','self','shift','department') NOT NULL DEFAULT 'everyone',
  department VARCHAR(128) NULL,
  window_key VARCHAR(32) NULL,
  place ENUM('any','on_playa','off_playa') NOT NULL DEFAULT 'any',
  PRIMARY KEY (grant_id),
  KEY permission (permission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- SuperAdmin-only today.
INSERT INTO op_permission_grant (grantee_type, grantee_id, permission)
SELECT 'role', 1, p FROM (
  SELECT 'shift_setup:update' AS p UNION ALL SELECT 'roles:update'
  UNION ALL SELECT 'superadmin_role:manage' UNION ALL SELECT 'saps:manage'
  UNION ALL SELECT 'qr_codes:manage' UNION ALL SELECT 'printing:view'
  UNION ALL SELECT 'tablets:provision'
) AS t;

-- Admin or SuperAdmin today (isAdmin() accepts either role).
INSERT INTO op_permission_grant (grantee_type, grantee_id, permission)
SELECT 'role', r, p FROM (SELECT 1 AS r UNION ALL SELECT 2) AS roles
CROSS JOIN (
  SELECT 'role_members:manage' AS p UNION ALL SELECT 'volunteers:list'
  UNION ALL SELECT 'volunteer_record:manage' UNION ALL SELECT 'email_bounced:update'
  UNION ALL SELECT 'shift_volunteers:add' UNION ALL SELECT 'shift_volunteers:remove'
  UNION ALL SELECT 'shift_volunteers:check_in' UNION ALL SELECT 'shift_volunteers:review'
) AS t;

-- Baseline for everyone signed in (isOwnerOrAdmin's "own record" half, the
-- on-playa walk-up rules in api/shifts/[timeId]/volunteers).
INSERT INTO op_permission_grant
  (grantee_type, permission, relationship, window_key, place) VALUES
  ('signed_in', 'volunteer_record:manage',   'self',     NULL,        'any'),
  ('signed_in', 'shift_volunteers:add',      'self',     NULL,        'any'),
  ('signed_in', 'shift_volunteers:add',      'everyone', NULL,        'on_playa'),
  ('signed_in', 'shift_volunteers:remove',   'self',     'self_drop', 'any'),
  ('signed_in', 'shift_volunteers:check_in', 'everyone', NULL,        'on_playa'),
  ('signed_in', 'shift_volunteers:review',   'everyone', NULL,        'on_playa');

-- Signed-out walk-up check-in on a lab tablet. The route still requires the
-- provisioned-device cookie before it asks; this grant adds the time window.
INSERT INTO op_permission_grant
  (grantee_type, permission, relationship, window_key, place) VALUES
  ('anyone', 'shift_volunteers:check_in', 'everyone', 'walkup_checkin', 'on_playa');
