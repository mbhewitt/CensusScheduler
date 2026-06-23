-- Migration: add config-driven signup-rule columns to op_position_type.
--
-- Two generic, data-driven knobs the signup dialog reads, instead of hardcoding
-- per-shift rules in the UI (per Mew 2026-06-17, toward the #279 configurable-
-- eligibility direction):
--
--   max_per_volunteer  most signups one volunteer should hold for this position
--                      across all shifts (NULL = no cap).
--                        Census Art Tour  = 1  (ride only one of the two tours)
--                        Census Lab Steward = 2 (stewards take 1-2, not more)
--   min_scheduled_csp  minimum total scheduled CSP a volunteer must already have
--                      to take this position (NULL = no requirement).
--                        Census Art Tour  = 1  (the no-CSP rider seat is for
--                        active volunteers — they must already hold at least one
--                        CSP-earning work shift; 0-CSP shifts like Welcome
--                        Party / DataBash don't count, #436)
--
-- Enforcement (per Chipper/Rescue 2026-06-22, #424/#438/#436): non-admins are
-- blocked at submit — a red error snackbar pops and the signup is stopped.
-- Admins are exempt: they get an orange warning on selection and can override.
-- These columns are the data backing for that gate.
--
-- Run-once (matches 001 — plain ALTER, not re-runnable). The UPDATEs below are
-- idempotent.

ALTER TABLE op_position_type
  ADD COLUMN max_per_volunteer INT DEFAULT NULL AFTER role_id,
  ADD COLUMN min_scheduled_csp INT DEFAULT NULL AFTER max_per_volunteer;

UPDATE op_position_type
  SET max_per_volunteer = 1, min_scheduled_csp = 1
  WHERE position = 'Census Art Tour';

UPDATE op_position_type
  SET max_per_volunteer = 2
  WHERE position = 'Census Lab Steward';
