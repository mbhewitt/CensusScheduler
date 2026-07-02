-- Migration: scope op_shift_times.shift_instance uniqueness to the shift type.
--
-- Before: UNIQUE KEY `shift_instance` (`shift_instance`) — an Instance label
-- had to be unique across EVERY shift time in the table. That forced globally
-- unique labels, so e.g. the Squaddie shift claiming "Monday Morning" blocked
-- the Lead shift from ever using it. The "Add time" UI only checks a label
-- against the current type's own times, so a cross-type collision slipped past
-- the UI and then failed the insert (silently, because the write was
-- fire-and-forget) — the added time vanished on reload with no error.
--
-- After: UNIQUE KEY on (shift_name_id, shift_instance) — labels must be unique
-- WITHIN a shift type but can repeat across types, matching the UI's check.
--
-- Safe on existing data: all shift_instance values are already globally unique,
-- so they are trivially unique per (shift_name_id, shift_instance). Nothing in
-- the app looks up a row by shift_instance alone (verified 2026-07-02), so no
-- code depends on the old global uniqueness.
--
-- Apply once per database (peers prod, census prod, test droplet):
--   mysql ... <db> < 2026-07-02-shift-instance-per-type.sql

ALTER TABLE `op_shift_times`
  DROP INDEX `shift_instance`,
  ADD UNIQUE KEY `shift_instance` (`shift_name_id`, `shift_instance`);
