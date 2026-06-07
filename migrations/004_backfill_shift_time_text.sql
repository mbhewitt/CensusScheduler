-- Migration: backfill start_time_text / end_time_text on op_shift_times (#395).
--
-- The Shift Types form GET reads ONLY the _text columns ("HH:mm") since the
-- date-ID refactor, but the UI save paths (handleTimeListAdd INSERT and the
-- PATCH timeListUpdate) only wrote the start_time / end_time DATETIME-shaped
-- varchars. Every shift time created or edited through the UI therefore came
-- back with blank/red time fields in the form, even though the data was
-- saved (the /shifts page falls back to start_time, so it looked fine there).
--
-- The code fix makes both save paths write the _text columns; this backfills
-- rows that were created/edited before the fix. start_time / end_time hold
-- "YYYY-MM-DD HH:mm" strings, so DATE_FORMAT extracts the time portion.
--
-- Idempotent: only touches rows where the _text column is NULL or empty.

UPDATE op_shift_times
SET start_time_text = DATE_FORMAT(start_time, '%H:%i')
WHERE (start_time_text IS NULL OR start_time_text = '')
  AND start_time IS NOT NULL
  AND start_time != '';

UPDATE op_shift_times
SET end_time_text = DATE_FORMAT(end_time, '%H:%i')
WHERE (end_time_text IS NULL OR end_time_text = '')
  AND end_time IS NOT NULL
  AND end_time != '';
