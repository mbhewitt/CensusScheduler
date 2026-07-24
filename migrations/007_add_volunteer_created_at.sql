-- Migration: add op_volunteers.created_at — account-creation timestamp.
--
-- Backs the "New Volunteers for Mailing List" report (papabear 2026-07-24):
-- the report shows WHEN each new volunteer signed up. No creation time was
-- stored before, so this captures it going FORWARD.
--
-- DATETIME (not TIMESTAMP): the implicit "first TIMESTAMP column gets
-- DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" rule would otherwise
-- bump created_at every time the row is touched (passcode change, etc.).
-- DATETIME has no such implicit ON UPDATE, so created_at stays the insert time.
--
-- DEFAULT CURRENT_TIMESTAMP: every new op_volunteers INSERT (self-register at
-- api/volunteers/account, Burner Profile seeding at api/auth/okta/callback,
-- any future path) auto-stamps without touching those handlers.
--
-- The UPDATE nulls out all rows that exist at migration time so only signups
-- AFTER this migration are dated (existing accounts show blank in the report),
-- exactly as agreed.
--
-- Idempotent-ish: the ADD COLUMN fails if run twice (column already exists);
-- guard by checking information_schema if re-running is a concern.

ALTER TABLE op_volunteers
  ADD COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE op_volunteers SET created_at = NULL;
