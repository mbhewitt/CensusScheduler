-- Migration: auto-set volunteer arrival date from their first SAP-eligible shift.
--
-- Problem: a SAP only fires once op_volunteers.arrival_date_id is set, but that
-- column is written ONLY by the manual "arrival day" form. Volunteers who sign
-- up for eligible shifts but never fill the form get arrival_date_id=NULL, so
-- their SAP never issues (e.g. Peter Lansing / 8391, and 22 others).
--
-- Fix: when a volunteer has a SAP-eligible shift, auto-set arrival_date_id to the
-- day BEFORE their first SAP-eligible shift, but only if it's currently NULL or
-- LATER than that day (never move an earlier, self-chosen arrival). The new
-- arrival_auto_set flag records that we set it, so the UI can show a warning
-- header inviting the volunteer to adjust if they're arriving earlier.

ALTER TABLE op_volunteers
  ADD COLUMN arrival_auto_set TINYINT(1) NOT NULL DEFAULT 0
  AFTER arrival_date_id;
