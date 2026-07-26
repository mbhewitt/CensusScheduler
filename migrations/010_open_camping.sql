-- Migration: Open Camping flag (papabear 2026-07-26).
--
-- Captured on the Create Account form AND the Tablet Responsibility Agreement
-- ("I'm in Open Camping"). Persisted so it survives, pre-fills across both
-- forms, and can be surfaced in the tablet report. Boolean-ish tinyint to match
-- the other op_volunteers flag columns.

ALTER TABLE op_volunteers
  ADD COLUMN open_camping tinyint(1) NOT NULL DEFAULT 0;
